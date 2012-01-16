var fs = require('fs')
var CONFIG = require('config').audit

var FILEOPTIONS = {flags: "a", encoding: "utf-8", mode: 0660}

module.exports.createAuditlog = function() {
	return new Auditlog()
}

function Auditlog() {
	if (CONFIG.type === 'FILE') {
		var logDir = CONFIG.FILE.logdir
		var fileName = CONFIG.FILE.filename
		this.file = fs.createWriteStream(logDir + '/' + fileName, FILEOPTIONS)
	}
	
	var self = this
	
	this.log = function(auditlogRecord) {
		if (self.verify(auditlogRecord)) {
			if (CONFIG.type === 'FILE') {
				self.file.write(self.stringify(auditlogRecord))
			} else {
				LOG.error('TODO implement syslog')
			}
		} else {
			LOG.error('bad logrecord: '+auditlogRecord)
		}
	}
	
	this.verify = function(auditlogRecord) {
		if (auditlogRecord.user && auditlogRecord.token && auditlogRecord.identifier && auditlogRecord.sequence) {
			return true
		}
		return false
	}
	
	this.stringify = function(auditlogRecord) {
		return JSON.stringify(auditlogRecord) + '\n'
	}
}
