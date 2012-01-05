var util = require('util')
var events = require('events')

module.exports.createSandbox = function(uuid, user, gitRepo, gitTree) {
	return new Sandbox(uuid, user, gitRepo, gitTree)
}

function Sandbox(uuid, user, gitRepo, gitTree) {
	this.uuid = uuid
	this.user = user
	this.gitRepo = gitRepo
	this.gitTree = gitTree
	
	var self = this
	
	this.build = function() {
		self.emit('ready')
	}
}

util.inherits(Sandbox, events.EventEmitter)
