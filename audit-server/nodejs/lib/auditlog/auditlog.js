var fs = require('fs')
var FILEOPTIONS = {flags: "a", encoding: "utf-8", mode: 0660}

module.exports.createAuditlog = function(logDir, fileName, callback) {
	return new Auditlog(logDir, fileName, callback)
}

function Auditlog(logDir, fileName, callback) {
	this.file = fs.createWriteStream(logDir + '/' + fileName, FILEOPTIONS)
	this.callback = callback
	
	var self = this
	
	this.syslog = function(auditlogRecord) {
		if (self.verify(auditlogRecord)) {
			self.file.write(self.stringify(auditlogRecord))
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
