var childproc = require('child_process')

module.exports.createGitInfo = function(dirname) {
	return new GitInfo(dirname)
}

function GitInfo(dirname) {
	this.dirname = dirname
	
	var self = this
	
	this.getUrl = function(callback) {
		childproc.execFile(
			'/usr/bin/git', 
			['config', '--get', 'remote.origin.url'],
			{ "cwd" : self.dirname },
			handleGitConfig
		)
		
	
		function handleGitConfig(err, stdout, stderr) {
			if (err) {
				callback(err)
			} else {
				callback(null, stdout.replace('\n',''))
			}
		}
	}
	
	this.getTree = function(callback) {
		childproc.exec(
			'/usr/bin/git log -1 | grep commit', 
			{ "cwd" : self.dirname },
			handleGitTree
		)
	
		function handleGitTree(err, stdout, stderr) {
			if (err) {
				callback(err)
			} else {
				callback(null, stdout.replace('commit ', '').replace('commit ', '').replace('\n',''))
			}
		}
	}
}