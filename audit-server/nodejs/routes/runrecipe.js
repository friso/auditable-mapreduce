var util = require('util')
var events = require('events')
var crypto = require('crypto')
var fs = require('fs')
var UUID = require('../lib/uuid')
var sandbox = require('../lib/sandbox')

module.exports = function(req, res) {
	var recipeRunner = new RecipeRunner(req, res);
	recipeRunner.run()
}

function RecipeRunner(request, response) {
	this.request = request
	this.response = response
	this.token = undefined
	this.user = undefined
	this.svnRepo = undefined
	this.svnRevision = undefined
	this.recipeName = undefined
	this.recipeVariables = undefined
	this.config = undefined
	this.requestData = undefined
	this.signature = undefined
	this.keepAliveId = undefined
	this.keepAliveTime = undefined
	
	var self = this
	
	this.run = function() {
		self.once('verified', populateSandbox)
		self.once('notverified', function(statusCode, message) {
			LOG.debug('Request not valid! ['+message+']['+this.request+']')

			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "RUN-REQUEST-NOT-VERIFIED",
       			sequence : 1,
       			meta : {
       				status: statusCode,
       				reason: message
       			}
			}
			auditserver.auditlog.log(auditlogRecord)
			
			this.response.writeHead(statusCode, { 'Content-Type':'text/plain'})
			this.response.end(message)
		})
		self.once('reconnected', reconnect)
	
		populateFromRequest(request, response)

		function populateFromRequest(req, res) {
			var d = '';
			req.on('data', function(data) { d += data })
			req.on('end' , function() {
				self.url = req.url
				self.user = req.params['user'] || ''
				self.svnRepo = req.query['url'] || ''
				self.svnRevision = req.query['revision'] || ''
				self.recipeName = req.params['recipe'] || ''
				self.requestData = d
				var dataObject = JSON.parse(self.requestData)
				self.recipeVariables = dataObject['recipevars'] || ''
				self.config = dataObject['hconf'] || ''
	
	    		var requestObject =	self.url + d
		    	var signature = req.header('X-AuditSignature') || ''

				self.token = UUID.generate()
		    	
		    	verify(requestObject, signature)
	    	})
	    	
	    	req.on('close', function(err) {
				var auditlogRecord = {
			    	user : self.user,
      				token : self.token,
       				identifier : "DISCONNECT-REQUEST",
       				sequence : 1
				}
				auditserver.auditlog.log(auditlogRecord)
	    	})
		}

		function verify(requestObject, signature) {
			if (!signature) {
				self.emit('notverified', 400, 'Missing signature request header (X-AuditSignature).')
			} else if (!self.recipeName || self.recipeName == null || self.recipeName.length === 0) {
				self.emit('notverified', 400, 'Request contains invalid or missing recipe.')
			} else if (!self.recipeVariables || self.recipeVariables == null || self.recipeVariables.length === 0) {
				self.emit('notverified', 400, 'Request body contains invalid or missing data.')
			} else if (!self.config || self.config == null || self.config.length === 0) {
				self.emit('notverified', 400, 'Request body contains invalid or missing data.')
			} else if (!self.svnRepo || self.svnRepo == null || self.svnRepo.length === 0) {
				self.emit('notverified', 400, 'Missing request parameter.')
			} else {
				fs.stat(auditserver.config.recipedir + '/' + self.recipeName, function(err) {
					if (err) {
						self.emit('notverified', 404, 'Recipe '+self.recipeName+' cannot be found on this server.')
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
									self.signature = signature
									if (auditserver.emitters[signature]) {
										self.token = auditserver.tokens[signature]
										self.emit('reconnected', signature)
									} else {
										self.emit('verified')
									}
								} else {
									self.emit('notverified', 404, 'Signature did not match.')
								}
							}
						})
					}
				})
			}
		}
		
		function reconnect(digest) {
			LOG.debug('Reconnecting to currently running recipe')
			
			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "RECONNECT-REQUEST",
       			sequence : 1
			}
			auditserver.auditlog.log(auditlogRecord)

			auditserver.emitters[digest].on('output', processOutput).on('end', endOutput)
		}
		
		function populateSandbox() {
			LOG.debug('Start processing the request')
			auditserver.createEmitter(self.token, self.signature).on('output', processOutput).on('end', endOutput)		
			
			var request = {
				type : 'HANDLE_REQUEST',
				token : self.token,
				user : self.user,
				svnRepo : self.svnRepo,
				svnRevision : self.svnRevision,
				recipeName : self.recipeName,
				recipeVariables : self.recipeVariables,
				hconf : self.config
			}
			
			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "RUN-REQUEST",
       			sequence : 1,
       			meta : request
			}
			auditserver.auditlog.log(auditlogRecord)
			
			self.response.writeHead(200, { 'Content-Type':'text/plain'})
			self.keepAliveTime = Date.now()
			startKeepAliveHandler(10000)
			auditserver.children[self.user].send(request)			
		}

		function processOutput(message) {
			if (message.out || message.err) {
				self.keepAliveTime = Date.now()
			}
			if (message.err) {
				self.response.write(message.err)
			}
			if (message.out) {
				self.response.write(message.out)
			}
		}

		function endOutput(message) {
			stopKeepAliveHandler()
			
			processOutput(message)
			self.response.end()

			var auditlogRecord = {
		    	user : self.user,
      			token : message.token,
       			identifier : "RUN-REQUEST",
       			sequence : 2,
       			meta : 'Request Finished'
			}
			auditserver.auditlog.log(auditlogRecord)
		}
		
		function startKeepAliveHandler(delay) {
			self.keepAliveId = setTimeout(keepAlive, delay)
		}
		
		function keepAlive() {
			var now = Date.now()
			if (getKeepAliveTime() + 10000 <= now) {
				self.response.write('\000')
				startKeepAliveHandler(10000)
			} else {
				var delay = 10000 - (now - getKeepAliveTime())
				startKeepAliveHandler(delay)
			}
		}

		function getKeepAliveTime() {
			return self.keepAliveTime
		}
		
		function stopKeepAliveHandler() {
			if (self.keepAliveId) {
				clearTimeout(self.keepAliveId)
			}
		}
			
	}
}

util.inherits(RecipeRunner, events.EventEmitter)
