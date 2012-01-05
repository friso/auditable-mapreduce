var util = require('util')
var events = require('events')
var crypto = require('crypto')
var fs = require('fs')
var UUID = require('../lib/uuid/uuid')

exports.index = function(req, res) {
  res.render('index', { "title":"Audit Server" })
};

exports.runRecipe = function(req, res) {
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
		self.once('verified', createSandbox)
		self.once('notverified', function() {
			this.response.writeHead(200, { 'Content-Type':'text/plain'})
			this.response.end('Hello, World!\n'+
				'  user '+self.user+' requested\n'+ 
				'  -- recipe '+self.recipeName+'\n'+ 
				'  -- giturl ['+self.gitRepo+']\n'+ 
				'  -- tree ['+self.gitTree+']\n'+
				'  -- data ['+self.requestData+']\n'+
				'    -- vars ['+JSON.stringify(self.recipeVariables)+']\n'+
				getRecipeVars()
				+
				'    -- hconf ['+self.config+']\n'+
				' but verification was NOT good\n\n')
		
			function getRecipeVars() {
				var result = ''
				for (variable in self.recipeVariables) {
					result += '    	-- var '+variable+':'+self.recipeVariables[variable]+'\n'
				}
				return result
			}
		})
	
		populateFromRequest(request, response)

		function createSandbox() { 
			var token =	createToken();
			var sandbox = createSandbox(token, self.user, self.gitRepo, self.gitTree);
			sandbox.build()
			sandbox.on('ready', function() {
				console.log('TODO Sandbox ready method')
			})
		}

		function populateFromRequest(req, res) {
			var d = '';
			req.on('data', function(data) { d += data })
			req.on('end' , function() {
				self.url = req.url
				self.user = req.params['user']
				self.gitRepo = req.query['url']
				self.gitTree = req.query['tree']
				self.recipeName = req.params['recipe']
				self.requestData = d
				var dataObject = JSON.parse(self.requestData)
				self.recipeVariables = dataObject['recipevars']
				self.config = dataObject['hconf']
	
	    		var requestObject =	self.url + d
		    	var signature = req.header('X-AuditSignature')
			    var pem = fs.readFileSync('../keys/'+self.user+'.pem')
		    	var publicKey = pem.toString('ascii')

	    	  	verify(requestObject, publicKey, signature)
	    	  	
	    	})
		}

		function verify(requestObject, publicKey, signature) {
			var verifier = crypto.createVerify('rsa-sha256')
			verifier.update(requestObject)
			if (verifier.verify(publicKey, signature, 'base64')) {
				self.emit('verified')
			} else {
				self.emit('notverified')
			}	
		}

		function createToken() {
			return UUID.generate()
		}
	}
}

util.inherits(RecipeRunner, events.EventEmitter)
