var util = require('util')
var events = require('events')
var fs = require('fs')
var childproc = require('child_process')

module.exports.createSandbox = function(uuid, container, gitRepo, callback, gitTree) {
	return new Sandbox(uuid, container, gitRepo, callback, gitTree)
}

function Sandbox(uuid, container, gitRepo, callback, gitTree) {
	this.uuid = uuid
	this.container = container
	this.gitRepo = gitRepo
	this.gitTree = gitTree
	this.callback = callback
	
	var self = this
	
	this.build = function() {
		//start the stuff
		var dir = container + '/' + uuid
		fs.mkdirSync(dir, 0770)
		fs.mkdirSync(dir + '/hadoop-conf', 0770)
		
		self.once('gitready', function() {
			//git is done, this should spawn all the config creation stuff
			//and when that is ready, it's time for the callback
			self.callback(null, dir)
		})
		
		//do git clone
		childproc.execFile(
			'/usr/bin/git', 
			['clone', gitRepo, dir + '/checkout'],
			{ "cwd" : dir }
		).on('exit', handleGitCloneReady)
		
		function handleGitCloneReady(code, sig) {
			if (code != 0) {
				self.callback({ "code" : code, "signal" : sig, "msg" : "git clone failed."})
				return
			}

			//git clone worked
			if (self.gitTree) {
				//perform checkout as well after clone
				childproc.execFile(
					'/usr/bin/git', 
					['checkout', gitTree],
					{ "cwd" : dir + '/checkout' }
				).on('exit', handleGitCheckoutReady)
			} else {
				self.emit('gitready')
			}
		}

		function handleGitCheckoutReady(code, sig) {
			if (code != 0) {
				self.callback({ "code" : code, "signal" : sig, "msg" : "git clone failed."})
				return
			}
			self.emit('gitready')
		}
	}
}

util.inherits(Sandbox, events.EventEmitter)
