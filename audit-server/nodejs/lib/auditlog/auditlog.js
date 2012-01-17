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
	} else if (CONFIG.type === 'SYSLOG') {	
		var winston = require('winston')
		require('winston-syslog').Syslog
		this.syslog = new (winston.Logger)({
	    	transports: [
				new (winston.transports.Syslog)({
				    host: CONFIG.SYSLOG.host,
    				port: CONFIG.SYSLOG.port,
		    		protocol: CONFIG.SYSLOG.protocol,
		    		facility: CONFIG.SYSLOG.facility,	
		    		type: CONFIG.SYSLOG.type
				})
			],
			levels : winston.config.syslog.levels
		})

		this.syslog.on('error', function(err) {
			LOG.error(JSON.stringify(err))
		})	
	}
	
	var self = this
	
	this.log = function(auditlogRecord) {
		if (self.verify(auditlogRecord)) {
			var message = JSON.stringify(auditlogRecord)
			if (CONFIG.type === 'FILE') {
				LOG.debug('Writing auditlog to file ['+message+']')
				self.file.write(message+ '\n')
			} else if (CONFIG.type === 'SYSLOG') {
				self.syslog.log('info', message, function(err) {
					if (err) {
						LOG.error('Unable to log to syslog. No auditing enabled so exiting application ['+err+']')
						process.exit(1)
					}
				})
			} else {
				LOG.error('Uninplemented audit type '+CONFIG.type)
				process.exit(1)
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
}
