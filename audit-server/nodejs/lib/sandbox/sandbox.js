var util = require('util')
var events = require('events')

module.exports.createSandbox = function(uuid, user, gitRepo, gitTree, callback) {
	return new Sandbox(uuid, user, gitRepo, gitTree)
}

function Sandbox(uuid, user, gitRepo, gitTree) {
	this.uuid = uuid
	this.user = user
	this.gitRepo = gitRepo
	this.gitTree = gitTree
	
	var self = this
	
	this.build = function(callback) {
		self.on('error', function(err) {
			callback(err)
		})
		self.on('end', function(data) {
			callback(null, data)
		})
		
		makeDirectory()
		
		function makeDirectory(callback) {
			self.emit('end', 'Not implemented yet', 'NOK')
		}
		
	}
	
	this.remove = function() {
		callback(null, null)
	}
}

util.inherits(Sandbox, events.EventEmitter)
