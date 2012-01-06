var util = require('util')
var events = require('events')
var fs = require('fs')
var childproc = require('child_process')

module.exports.createSandbox = function(uuid, user, gitRepo, gitTree) {
	return new Sandbox(uuid, user, gitRepo, gitTree)
}

function Sandbox(uuid, user, gitRepo, gitTree) {
	this.uuid = uuid
	this.user = user
	this.gitRepo = gitRepo
	this.gitTree = gitTree
	
	var self = this
	
	this.build = function(callback) {
		
		var message
		var sandboxDir = auditserver.config.sandboxdir+ '/' + self.user + '-' + self.uuid
		self.emit('output', 'creating sandbox directory')
		var userid, groupid = 0
		
		childproc.execFile('/usr/bin/id', ['-u', self.user], { }, function(error, stdout, stderr) {
			if (error) {
				message = stderr
				self.emit('end', error, message)
				callback(error, message)
			} else {
				userid = parseInt(stdout)
				childproc.execFile('/usr/bin/id', ['-g', self.user], { }, function(error, stdout, stderr) {
					if (error) {
						message = stderr
						self.emit('end', error, message)
						callback(error, message)
					} else {
						groupid = parseInt(stdout)
						fs.mkdir(sandboxDir, '0660', function(err) {
							if (err) {
								message = 'Error while creating sandbox directory'
								self.emit('end', err, message)
								callback(err, message)
							} else {
								fs.chown(sandboxDir, userid, groupid, function(err) {
									if (err) {
										message = 'Error while change ownership of sandbox directory'
										self.emit('end', err, message)
										callback(err, message)
									} else {
										self.emit('end', null, uuid)
										callback(null, uuid)
									}
								})
							}
						})
					}
				})
			}
		})
	}
	
	this.remove = function() {
		callback(null, null)
	}
}

util.inherits(Sandbox, events.EventEmitter)
