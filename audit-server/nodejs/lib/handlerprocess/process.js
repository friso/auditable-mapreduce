var sandbox = require('../sandbox')
var hconf = require('../hconf')
var fs = require('fs')
var recipes = require('../recipes')

global.auditserver = {}

if (!process.send) {
	console.log('Should be run as child process of the audit server. Do not run standalone.')
	process.exit(1)
}

var program = require('commander')
program
	.version('0.0.1')
	.usage('<options>')
	.option('-u, --username <username>', 'The UID or username to setuid() to. Will only be used when started as root, ignored otherwise.')
	.parse(process.argv)

if (process.getuid() == 0) {
	if (program.username) {
		process.setuid(program.username)
	} else {
		console.log('Did not receive a UID to change privilege level down to. Not running as root. Exiting...')
		process.exit(2)
	}
}

process.on('message', function(m) {
	switch(m.type) {
		case 'CONFIGURATION':
			global.auditserver.config = m.config
			break
		case 'HANDLE_REQUEST':
			var handler = new RequestHandler(m)
			handler.handleRequest()
			break
		default:
			console.log('This should not happen!')
			break
	}
})

process.send({
	type : 'HANDLER_READY'
})

function RequestHandler(m) {
	this.message = m
	this.box = undefined
	var self = this
	
	this.handleRequest = function() {
		self.box = sandbox.createSandbox(self.message.token, self.message.user, self.message.gitRepo, self.message.gitTree)
		self.box.build(sandboxReady)

		function sandboxReady(err) {
			if (err) {
				sendError(err)
			} else {
				fs.mkdir(self.box.getDir() + '/hconf', '0777', function(err) {
					if (err) {
						sendError(err)
					} else {
						hconf.writeHadoopConfiguration(self.message.hconf, self.box.getDir() + '/hconf/core-site.xml', hconfReady)
					}
				})
			}
		}
		
		function hconfReady(err) {
			if (err) {
				sendError(err)
			} else {
				var recipe = recipes.createRecipe(
					auditserver.config.recipedir + '/' + self.message.recipeName, 
					self.message.recipeVariables, 
					self.box.getDir(), '/bin/bash')
			
				recipe.on('output', function(o) {
					o.type = 'OUTPUT'
					o.token = self.message.token
					process.send(o)
				})
				
				recipe.run(recipeReady)
			}
		}
		
		function recipeReady(err) {
			self.box.cleanup(function() {
				process.send({ type : 'REQUEST_END', token : self.message.token, err : err })
			})
		}
		
		function sendError(err) {
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
