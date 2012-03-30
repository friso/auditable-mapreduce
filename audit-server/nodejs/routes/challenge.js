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
			
			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "CHALLENGE-REQUEST",
       			sequence : 1,
       			meta : {
       				jar : self.jarname,
       				sha1 : self.sha1
       			}
			}
			auditserver.auditlog.log(auditlogRecord)

			//check that user + sandbox combo exists
			fs.stat(self.sandboxdir, handleSandboxStat)
		})
		
		function handleSandboxStat(err, stat) {
			if (err) {
				replyNok(404, 'User or token not found.')
			} else {
				//search for jar in sandbox or whitelist dir
				searchSandbox()
			}
		}
		
		function searchSandbox() {
			var foundFiles = []
			walk(self.sandboxdir, addWhitelistFiles)
			
			function addWhitelistFiles(err, result) {
				foundFiles = foundFiles.concat(result)
				if (err) {
					replyNok(404, 'No jar files found in any context.')
				} else {
					walk(auditserver.config.whitelistdir, handleFiles)					
				}	
			}
			
			function handleFiles(err, result) {
				foundFiles = foundFiles.concat(result)
				if (err || foundFiles.length === 0) {
					replyNok(404, 'No jar files found in any context.')
				} else if (foundFiles.length == 1) {
					var location = foundFiles.pop()
					createFileSha1(location, function(hash) {
						if (hash == self.sha1) {
							replyOk(location, 'Found.')
						} else {
							replyNok(403, 'Jar SHA1 does not match.')
						}
					})
				} else {
					var location = foundFiles.pop()
					createFileSha1(location, function(hash) {
						if (hash == self.sha1) {
							replyOk(location, 'Found.')
						} else {
							process.nextTick(handleFiles)
						}
					})
				}
			}
			
			var walk = function(dir, done) {
			  var results = [];
			  fs.readdir(dir, function(err, list) {
			    if (err) return done(err);
			    var pending = list.length;
			    if (!pending) return done(null, results);
			    list.forEach(function(file) {
			      file = dir + '/' + file;
			      fs.stat(file, function(err, stat) {
			        if (stat && stat.isDirectory()) {
			          walk(file, function(err, res) {
			            results = results.concat(res);
			            if (!--pending) done(null, results);
			          });
			        } else {
					  if (endsWith(file, '.jar')) {
			            results.push(file);
				  	  }
			          if (!--pending) done(null, results);
			        }
			      });
			    });
			  });
			};
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
			
			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "CHALLENGE-REQUEST",
       			sequence : 2,
       			meta : {
       				jar : self.jarname,
       				sha1 : self.sha1,
       				result : 'NOK',
       				code : code,
       				reason : why
       			}
			}
			auditserver.auditlog.log(auditlogRecord)

		}
		
		function replyOk(location, why) {
			var auditlogRecord = {
		    	user : self.user,
      			token : self.token,
       			identifier : "CHALLENGE-REQUEST",
       			sequence : 2,
       			meta : {
					matchingJarPath : location,
       				jar : self.jarname,
       				sha1 : self.sha1,
       				result : 'OK',
       				code : 200,
       				reason : why
       			}
			}
			auditserver.auditlog.log(auditlogRecord)
			
			self.response.writeHead(200)
			self.response.write(JSON.stringify({
				result : 'OK',
				reason : why,
				matchingJarPath : location
			}))
			self.response.end()
		}
		
		function endsWith(str, suffix) {
		    return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}
	}
}
