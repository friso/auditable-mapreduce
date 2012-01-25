var fs = require('fs')
var childproc = require('child_process')
var removeRecursively = require('rimraf')

module.exports.createSandbox = function(uuid, user, svnRepo, svnRevision) {
	return new Sandbox(uuid, user, svnRepo, svnRevision)
}

function Sandbox(uuid, user, svnRepo, svnRevision) {
	this.uuid = uuid
	this.user = user
	this.svnRepo = svnRepo
	this.svnRevision = svnRevision
	
	var self = this
	
	this.build = function(callback) {
		LOG.debug("Creating sandbox dir: " + self.getDir())
		fs.mkdir(self.getDir(), '0777', function(err) {
			console.log("WILL THIS EVER HAPPEN?!?!?!?")
			LOG.debug("Created sandbox dir: " + self.getDir())
			if (err) {
				LOG.debug("Error creating sandbox dir: " + err)
			}
			childproc.execFile(
				'/usr/bin/svn', 
				['checkout', self.svnRepo, self.getDir() + '/checkout'],
				{ "cwd" : self.getDir() },
				function(error, stdout, stderr) {
					LOG.debug("svn stdout => " + stdout)
					LOG.debug("svn stderr => " + stderr)
				}
			).on('exit', handleCheckoutReady)
		})
	
		function handleCheckoutReady(code) {
			if (code != 0) {
				callback({ "code" : code, "msg" : "svn checkout failed."})
				return
			}
		
			if (self.svnRevision) {
				//perform switch as well after co
				childproc.execFile(
					'/usr/bin/svn', 
					['switch', '--revision', self.svnRevision, self.svnRepo],
					{ "cwd" : self.getDir() + '/checkout' }
				).on('exit', handleSvnSwitchReady)
			} else {
				callback()
			}
		}
	
		function handleSvnSwitchReady(code) {
			if (code != 0) {
				callback({ "code" : code, "msg" : "svn switch failed."})
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
