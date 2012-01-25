var childproc = require('child_process')

module.exports.createSvnInfo = function(dirname) {
	return new SvnInfo(dirname)
}

function SvnInfo(dirname) {
	this.dirname = dirname
	
	var self = this
	
	this.getUrl = function(callback) {
		childproc.exec(
			'/usr/bin/svn info | grep URL',
			{ "cwd" : self.dirname },
			handleUrl
		)
		
	
		function handleUrl(err, stdout, stderr) {
			if (err) {
				callback(err)
			} else {
				callback(null, stdout.replace('URL: ','').replace('\n',''))
			}
		}
	}
	
	this.getRevision = function(callback) {
		childproc.exec(
			'/usr/bin/svn info | grep Revision', 
			{ "cwd" : self.dirname },
			handleRevision
		)
	
		function handleRevision(err, stdout, stderr) {
			if (err) {
				callback(err)
			} else {
				callback(null, stdout.replace('Revision: ', '').replace('\n',''))
			}
		}
	}
}