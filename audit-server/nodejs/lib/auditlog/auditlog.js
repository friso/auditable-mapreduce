var winston = require('winston')
var CONFIG = require('config').audit

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
					timestamp: true
	   			})
			],
    		levels : { info: 0 }
		})	  	
	} else if (CONFIG.type === 'SYSLOG') {	
	/*
		require('winston-syslog').Syslog
		self.logger = new (winston.Logger)({
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

		self.logger.on('error', function(err) {
			LOG.error(JSON.stringify(err))
		})	
	*/
	}
	
	this.log = function(auditlogRecord) {
		if (self.verify(auditlogRecord)) {
			var message = JSON.stringify(auditlogRecord)
			if (CONFIG.type === 'FILE') {
				LOG.debug('Writing auditlog to file ['+message+']')
				self.logger.info(message)
			} else if (CONFIG.type === 'SYSLOG') {
				/*
				self.logger.log('info', message, function(err) {
					if (err) {
						LOG.error('Unable to log to syslog. No auditing enabled so exiting application ['+err+']')
						process.exit(1)
					}
				})
			*/
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
