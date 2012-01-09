var util = require('util')
var events = require('events')
var crypto = require('crypto')
var fs = require('fs')
var UUID = require('../lib/uuid/uuid')
var sandbox = require('../lib/sandbox/sandbox')

module.exports = function(req, res) {
	var recipeRunner = new RecipeRunner(req, res);
	recipeRunner.run()
}

function RecipeRunner(request, response) {
	this.request = request
	this.response = response
	this.token = undefined
	this.user = undefined
	this.gitRepo = undefined
	this.gitTree = undefined
	this.recipeName = undefined
	this.recipeVariables = undefined
	this.config = undefined
	this.requestData = undefined
	
	
	var self = this
	
	this.run = function() {
		self.once('verified', populateSandbox)
		self.once('notverified', function(statusCode, message) {
			this.response.writeHead(statusCode, { 'Content-Type':'text/plain'})
			this.response.end(message)
		})
	
		populateFromRequest(request, response)

		function populateFromRequest(req, res) {
			var d = '';
			req.on('data', function(data) { d += data })
			req.on('end' , function() {
				self.url = req.url
				self.user = req.params['user'] || ''
				self.gitRepo = req.query['url'] || ''
				self.gitTree = req.query['tree'] || ''
				self.recipeName = req.params['recipe'] || ''
				self.requestData = d
				var dataObject = JSON.parse(self.requestData)
				self.recipeVariables = dataObject['recipevars'] || ''
				self.config = dataObject['hconf'] || ''
	
	    		var requestObject =	self.url + d
		    	var signature = req.header('X-AuditSignature') || ''
		    	
		    	verify(requestObject, signature)
	    	})
		}

		function verify(requestObject, signature) {
			if (!signature) {
				self.emit('notverified', 400, 'Missing signature request header (X-AuditSignature).')
			} else if (!self.recipeVariables || self.recipeVariables == null || self.recipeVariables.length === 0) {
				self.emit('notverified', 400, 'Request body contains invalid or missing data.')
			} else if (!self.config || self.config == null || self.config.length === 0) {
				self.emit('notverified', 400, 'Request body contains invalid or missing data.')
			} else if (!self.gitRepo || self.gitRepo == null || self.gitRepo.length === 0) {
				self.emit('notverified', 400, 'Missing request parameter.')
			} else {
				fs.stat(auditserver.config.keydir+ '/' + self.user+'.pem', function(err) {
				    var pem
					if (err) {
						self.emit('notverified', 404, 'User '+self.user+' cannot be found on this server.')
					} else {
						pem = fs.readFileSync(auditserver.config.keydir + '/' + self.user+'.pem')
						var publicKey = pem.toString('ascii')
					
						var verifier = crypto.createVerify('RSA-SHA256')
						verifier.update(requestObject)
						if (verifier.verify(publicKey, signature, 'base64')) {
							self.emit('verified')
						} else {
							self.emit('notverified', 404, 'Signature did not match.')
						}
					}
				})
			}
		}
		
		function populateSandbox() {
			self.response.writeHead(200)
			
			var token =	UUID.generate()
			var box = sandbox.createSandbox(token, self.user, self.gitRepo, self.gitTree)
			box.on('output', function(data) {
				self.response.write('Output redirect of sandbox: Not yet imlpemented.')
			})
			 
			box.build(createAndRunRecipe)
		}

		function createAndRunRecipe(err, data) {
			self.response.write('createAndRunRecipe: Not yet imlpemented.')
			
			self.response.end()
		}
	}
}

util.inherits(RecipeRunner, events.EventEmitter)
