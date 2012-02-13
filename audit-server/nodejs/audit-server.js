#! /usr/local/bin/node
var events = require('events')
var fs = require('fs')
var cp = require('child_process')

var express = require('express')
var program = require('commander')

var routes = require('./routes')
var logFactory = require('./lib/logging')

process.title = 'audit'
process.chdir(__dirname)

var newmask = 0023;
process.umask(newmask);

program
	.version('0.0.1')
	.usage('<options>')
	.option('-b, --basedir <basedir>', 'Override the audit server basedir. Using -ksrw takes priority over the default basedir relative paths.')
	.option('-k, --keydir <keydir>', 'Override the default keys direcotry user to find users\' public keys.')
	.option('-s, --sandboxdir <sandboxdir>', 'Override the default location that audit server uses to manage sandboxes.')
	.option('-r, --recipedir <recipedir>', 'Override the default location for storing runnable recipes.')
	.option('-w, --whitelistdir <whitelistdir>', 'Override the default location for keeping whitelisted jars (i.e. trusted jars, always OK to schedule).')
	.option('-u, --username <username>', 'The UID or username to setuid() to. Will only be used when started as root, ignored otherwise.')
	.option('-d, --debug', 'Enable debug logging.')
	.parse(process.argv)

var bd = program.basedir || __dirname + '/..'

var numberOfChildProcessesThatAreStillInitializing = 0

global.auditserver = {
	config : {
		basedir : bd,
		keydir : program.keydir || bd + '/keys/',
		recipedir : program.recipedir || bd + '/recipe-templates/',
		sandboxdir : program.sandboxdir || bd + '/sandbox/',
		whitelistdir : program.whitelistdir || bd + '/whitelist/',
		username : program.username || 'auditserver'
	},
	children : [],
	emitters : [],
	digests : [],
	tokens : [],
	createEmitter : function(token, digest) {
		var e = new events.EventEmitter()
		auditserver.emitters[token] = e
		auditserver.emitters[digest] = e
		auditserver.digests[token] = digest
		auditserver.tokens[digest] = token
		return e
	},
}

require('./lib/auditlog').createAuditlog(function(auditlogger) {
	auditserver['auditlog'] = auditlogger
})

console.info('Audit server starting...')

var app = module.exports = express.createServer()

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
})

app.configure('production', function() {
  app.use(express.errorHandler()); 
})

// Main page
app.get('/', routes.index)

//run recipe
app.post('/recipe/:recipe/:user/run', routes.runRecipe)

//challenge - response
app.get('/challenge/:user/:token/:jarname/:sha1', routes.challenge)

if (process.getuid() == 0) {
	readUserListAndPopulateChildren(true)
} else {
	readUserListAndPopulateChildren(false)
}

global.LOG = logFactory.getLogger(false,program.debug)

function MessageHandler(user) {
	this.user = user
	var self = this
	
	this.handleChildProcessMessage = function(message) {
		switch(message.type) {
			case 'HANDLER_READY_FOR_CONFIG':
				auditserver.children[self.user].send({
					type : 'CONFIGURATION',
					config : auditserver.config,
					node_env : process.env.NODE_ENV
				})
				break
			case 'HANDLER_READY':
				numberOfChildProcessesThatAreStillInitializing--
				startListeningWhenAllChildrenReady()
				break
			case 'OUTPUT':
				auditserver.emitters[message.token].emit('output', message)
				break
			case 'REQUEST_END':
				auditserver.emitters[message.token].emit('end', message)
				delete auditserver.emitters[message.token]
				delete auditserver.emitters[auditserver.digests[message.token]]
				delete auditserver.tokens[auditserver.digests[message.token]]
				delete auditserver.digests[message.token]
				break
		}
	}
	
}

function startListeningWhenAllChildrenReady() {
	if (numberOfChildProcessesThatAreStillInitializing === 0) {
		app.listen(9090);
		if (LOG) {
			LOG.info('Audit server listening on port '+app.address().port+' in '+app.settings.env+' mode')
		} else {
			console.log('Audit server listening on port '+app.address().port+' in '+app.settings.env+' mode')
		}

		if (process.send) {
			process.send({"status": "running", "port" : app.address().port })
		}
	}
}

function stopAuditServerWhenChildExits() {
	if (LOG) {
		LOG.error('Child process died, Auditserver must be stopped')
	} else {
		console.log('Child process died, Auditserver must be stopped')
	}
	process.kill()
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function readUserListAndPopulateChildren(asRoot) {
	fs.readdir(auditserver.config.keydir, function(err, files) {
		if (err) {
			if (LOG) {
				LOG.error('Could not list files in key directory. Exiting...')
			} else {
				console.log('Could not list files in key directory. Exiting...')
			}
			process.exit(1)
		}
		populateChildren(files, asRoot)
	})
}

function populateChildren(files, asRoot) {
	numberOfChildProcessesThatAreStillInitializing = files.length

	for (var i = 0; i < files.length; i++) {
		if (endsWith(files[i], '.pem')) {
			var usr = files[i].substring(0, files[i].length - 4)
			var args = ''
			if (asRoot) {
				args += '--username ' + usr
			}
			if (program.debug) {
				args += ' --debug '
			}
			var p = cp.fork(
				__dirname + '/lib/handlerprocess/process.js', 
				args.split(' ')
			)
			p.on('message', new MessageHandler(usr).handleChildProcessMessage)
			p.on('exit', stopAuditServerWhenChildExits)
			auditserver.children[usr] = p
		} else {
			numberOfChildProcessesThatAreStillInitializing--
		}
 	}
	
	if (asRoot) {
		process.setuid(auditserver.config.username)
	}
}
