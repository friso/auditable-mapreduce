var fs = require('fs')
var crypto = require('crypto')
var findit = require('findit')

module.exports = function(req, res) {
	var runner = new ChallengeRunner(req, res)
	runner.run()
}

function ChallengeRunner(req, res) {
	this.request = req
	this.response = res
	this.token = undefined
	this.user = undefined
	this.jarname = undefined
	this.sha1 = undefined
	this.sandboxdir = undefined
	
	
	var self = this
	
	this.run = function() {
		req.on('end' , function() {
			self.user = req.params['user']
			self.token = req.params['token']
			self.jarname = req.params['jarname']
			self.sha1 = req.params['sha1']
			self.sandboxdir = auditserver.config.sandboxdir + '/' + self.user + '-' + self.token
			
			//check that user + sandbox combo exists
			fs.stat(self.sandboxdir, handleSandboxStat)
		})
		
		function handleSandboxStat(err, stat) {
			if (err) {
				replyNok(404, 'User or token not found.')
			} else {
				//search for jar in whitelist dir
				fs.stat(auditserver.config.whitelistdir + '/' + self.jarname + '.sha1', handleWhitelistCacheStat)
			}
		}
		
		function handleWhitelistCacheStat(err, stat) {
			if (err) {
				fs.stat(auditserver.config.whitelistdir + '/' + self.jarname, handleWhitelistStat)
			} else {
				fs.readFile(
					auditserver.config.whitelistdir + '/' + self.jarname + '.sha1',
					'ascii',
					function(err, data) {
						if (data === self.sha1) {
							replyOk('Found in whitelist.')
						}
					})
			}
		}
		
		function handleWhitelistStat(err, stat) {
			if (err) {
				//search for jar in sandbox
				searchSandbox(false)
			} else {
				createFileSha1(auditserver.config.whitelistdir + '/' + self.jarname, function(result) {
					fs.writeFile(auditserver.config.whitelistdir + '/' + self.jarname + '.sha1', result, 'ascii')
					if (result === self.sha1) {
						replyOk('Found in whitelist.')
					} else {
						//search for jar in sandbox
						searchSandbox(true)
					}
				})
			}
		}
		
		function searchSandbox(mismatchingSha1InWhitelist) {
			var foundFiles = []
			findit.find(self.sandboxdir, function(name) {
				if (endsWith(name, self.jarname)) {
					foundFiles.push(name)
				}
			}).on('end', handleFiles)
			
			function handleFiles() {
				if (foundFiles.length === 0) {
					if (mismatchingSha1InWhitelist) {
						replyNok(403, 'Jar SHA1 does not match.')
					} else {
						replyNok(404, 'Jar file not found in any context.')
					}
				} else if (foundFiles.length == 1) {
					createFileSha1(foundFiles.pop(), function(hash) {
						if (hash == self.sha1) {
							replyOk('Found in sandbox.')
						} else {
							replyNok(403, 'Jar SHA1 does not match.')
						}
					})
				} else {
					createFileSha1(foundFiles.pop(), function(hash) {
						if (hash == self.sha1) {
							replyOk('Found in sandbox.')
						}
					})
				}
			}
		}
		
		function createFileSha1(path, callback) {
			fs.readFile(path, function(err, data) {
				var hash = crypto.createHash('sha1')
				hash.update(data)
				var r = hash.digest('hex')
				callback(r)
			})
		}
		
		function replyNok(code, why) {
			self.response.writeHead(code)
			self.response.write(JSON.stringify({
				result : 'NOK',
				reason : why
			}))
			self.response.end()
		}
		
		function replyOk(why) {
			self.response.writeHead(200)
			self.response.write(JSON.stringify({
				result : 'OK',
				reason : why
			}))
			self.response.end()
		}
		
		function endsWith(str, suffix) {
		    return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}
	}
}
