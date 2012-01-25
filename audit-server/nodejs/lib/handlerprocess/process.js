var sandbox = require('../sandbox')
var hconf = require('../hconf')
var fs = require('fs')
var recipes = require('../recipes')
var logFactory = require('../logging')

global.auditserver = {}

if (!process.send) {
	LOG.error('Should be run as child process of the audit server. Do not run standalone.')
	process.exit(1)
}

var program = require('commander')
program
	.version('0.0.1')
	.usage('<options>')
	.option('-u, --username <username>', 'The UID or username to setuid() to. Will only be used when started as root, ignored otherwise.')
	.option('-d, --debug', 'Enable debug logging')
	.parse(process.argv)

global.LOG = logFactory.getLogger(program.debug)

require('../auditlog').createAuditlog(function(auditlogger) {
	auditserver['auditlog'] = auditlogger
})

if (process.getuid() == 0) {
	if (program.username) {
		process.setuid(program.username)
		process.setgid(program.username)
	} else {
		LOG.error('Did not receive a UID to change privilege level down to. Not running as root. Exiting...')
		process.exit(2)
	}
}

process.on('message', function(m) {
	switch(m.type) {
		case 'CONFIGURATION':
			global.auditserver.config = m.config
			process.send({
				type : 'HANDLER_READY'
			})

			break
		case 'CLOSE':
			process.send({
				type : 'HANDLER_CLOSED'
			})
		case 'HANDLE_REQUEST':
			var handler = new RequestHandler(m)
			handler.handleRequest()
			break
		default:
			LOG.error('This should not happen!')
			break
	}
})

process.send({
	type : 'HANDLER_READY_FOR_CONFIG'
})

function RequestHandler(m) {
	this.message = m
	this.box = undefined
	var self = this
	
	this.handleRequest = function() {
		LOG.debug('Creating sandbox for user '+self.message.user)
		self.box = sandbox.createSandbox(self.message.token, self.message.user, self.message.svnRepo, self.message.svnRevision)
		LOG.debug('Building the sandbox')
		self.box.build(sandboxReady)

		function sandboxReady(err) {
			if (err) {
				sendError(err)
			} else {
				LOG.debug('Creating a hadoop conf dir in the sandbox')
				fs.mkdir(self.box.getDir() + '/hconf', '0777', function(err) {
					if (err) {
						sendError(err)
					} else {
						self.message.hconf['auditable.mapreduce.sessionToken'] = self.message.token
						LOG.debug('Creating a hadoop configuration in the sandbox')
						hconf.writeHadoopConfiguration(self.message.hconf, self.box.getDir() + '/hconf/core-site.xml', hconfReady)
					}
				})
			}
		}
		
		function hconfReady(err) {
			if (err) {
				sendError(err)
			} else {
				LOG.debug('Creating the recipe from template '+self.message.recipeName)
				var recipe = recipes.createRecipe(
					self.message.user,
					self.message.token,
					auditserver.config.recipedir + '/' + self.message.recipeName, 
					self.message.recipeVariables, 
					self.box.getDir(), '/bin/bash')
			
				recipe.on('output', function(o) {
					o.type = 'OUTPUT'
					o.token = self.message.token
					process.send(o)
				})

				LOG.debug('Start running the recipe')				
				recipe.run(recipeReady)
			}
		}
		
		function recipeReady(err) {
			LOG.debug('Recipe finished')
			self.box.cleanup(function() {
				process.send({ type : 'REQUEST_END', token : self.message.token, err : err })
			})
		}
		
		function sendError(err) {
			LOG.debug('Error in process.js :'+err)
			self.box.cleanup(function() {
				process.send({
					type : 'REQUEST_END',
					token : self.message.token,
					err : err
				})
			})
		}
	}
}
