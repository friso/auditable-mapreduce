var CONFIG = require('config').audit
var winston = require('winston')
var SysLogger = require('ain2');

module.exports.createAuditlog = function(callback) {
	return new Auditlog(callback)
}

function Auditlog(callback) {
	var logger;
	var self = this
	
	if (CONFIG.type === 'FILE') {
		var logDir = CONFIG.FILE.logdir
		var fileName = CONFIG.FILE.filename
 		self.logger = new (winston.Logger)({
	   		transports: [
				new (winston.transports.File)({
        			level: 'info',
       				colorize: false,
					filename: logDir + '/' + fileName,
					json : false,
					timestamp: true,
					options : { 
						flags: 'a',
						encoding: 'utf-8',
						mode: 0666
					}
	   			})
			],
    		levels : { info: 0 }
		})	  	
	} else if (CONFIG.type === 'SYSLOG') {	
		self.logger = new SysLogger({
			tag: CONFIG.SYSLOG.tag,
			facility: CONFIG.SYSLOG.facility,
			hostname : CONFIG.SYSLOG.host,
			port: CONFIG.SYSLOG.port
		})
	}
	
	this.log = function(auditlogRecord) {
		if (self.verify(auditlogRecord)) {
			var message = JSON.stringify(auditlogRecord)
			if (CONFIG.type === 'FILE') {
				LOG.debug('Writing auditlog to file ['+message+']')
				self.logger.info(message)
			} else if (CONFIG.type === 'SYSLOG') {
				self.logger.send(message, 'info')
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

	if (typeof callback === 'function') {
		callback(this)
	}
}
