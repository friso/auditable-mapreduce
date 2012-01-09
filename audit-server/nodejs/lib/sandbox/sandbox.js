var fs = require('fs')
var childproc = require('child_process')
var removeRecursively = require('rimraf')

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
		
		fs.mkdir(self.getDir(), '0777', function(err) {
			childproc.execFile(
				'/usr/bin/git', 
				['clone', self.gitRepo, self.getDir() + '/checkout'],
				{ "cwd" : self.getDir() }
			).on('exit', handleGitCloneReady)
		})
	
		function handleGitCloneReady(code) {
			if (code != 0) {
				callback({ "code" : code, "msg" : "git clone failed."})
				return
			}
		
			if (self.gitTree) {
				//perform checkout as well after clone
				childproc.execFile(
					'/usr/bin/git', 
					['checkout', self.gitTree],
					{ "cwd" : self.getDir() + '/checkout' }
				).on('exit', handleGitCheckoutReady)
			} else {
				callback()
			}
		}
	
		function handleGitCheckoutReady(code) {
			if (code != 0) {
				callback({ "code" : code, "msg" : "git checkout failed."})
			} else {
				callback()
			}
		}
	}
	
	this.cleanup = function(callback) {
		removeRecursively(self.getDir(), {}, callback)
	}
	
	this.getDir = function() {
		return auditserver.config.sandboxdir+ '/' + self.user + '-' + self.uuid
	}
}
