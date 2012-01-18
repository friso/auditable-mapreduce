process.env.NODE_ENV='test'

var auditlog = require('../../lib/auditlog')
var fs = require('fs')
var logFactory = require('../../lib/logging')

var logger, validAuditlogRecord,validAuditlogRecord2, invalidAuditlogRecord;

global.LOG = logFactory.getLogger(false)

exports.setUp = function(callback) {
	
    validAuditlogRecord = {
    	user : "userName"
       ,token : "uuid-1234"
       ,identifier : "RECIPE"
       ,sequence : 1
       ,stuff : { "stuffding1" : "value" }
    }
    validAuditlogRecord2 = {
    	user : "userName2"
       ,token : "uuid-1235"
       ,identifier : "RECIPE2"
       ,sequence : 2
       ,stuff : { "stuffding2" : "value" }
    }
    invalidAuditlogRecord = {
    	userr :"userName"
       ,identifier : "RECIPE"
       ,sequence : 1
    }
    auditlog.createAuditlog(function(auditlogger) {
    	logger = auditlogger
    	callback()
    })
}

exports.tearDown = function(callback) {
	try {
		fs.unlinkSync('/tmp/canCreateAnAuditlogFile.log')
	} catch (e) {
		//Ignore file not existing
	}
	callback()
}

exports.canVerifyACorrectAuditlogRecord = function(test){
    test.expect(1)
    var result = logger.verify(validAuditlogRecord)
    test.equals(result, true, 'audit log record succesfully verified')
    test.done()
}

exports.cannotVerifyAInCorrectAuditlogRecord = function(test){
    test.expect(1)
    var result = logger.verify(invalidAuditlogRecord)
    test.equals(result, false, 'invalid audit log record succesfully verified')
    test.done()
}

exports.canLogACorrectAuditlogRecord = function(test){
    test.expect(4)
    var numberOfLogRecordsLogged = 0
    
    logger.logger.on('logging', function (transport, level, msg, meta) {
  		numberOfLogRecordsLogged++
  		if (numberOfLogRecordsLogged == 1) {
	  		test.equals(level, 'info', 'audit logrecord logged at the wrong level')
  			test.equals(msg, '{"user":"userName","token":"uuid-1234","identifier":"RECIPE","sequence":1,"stuff":{"stuffding1":"value"}}', 'audit logrecord not correctly logged')
  		} else if (numberOfLogRecordsLogged == 2) {
	  		test.equals(level, 'info', 'audit logrecord logged at the wrong level')
  			test.equals(msg, '{"user":"userName2","token":"uuid-1235","identifier":"RECIPE2","sequence":2,"stuff":{"stuffding2":"value"}}', 'audit logrecord2 not correctly logged')
  			test.done()
  		}
	});

    logger.log(validAuditlogRecord)
    logger.log(validAuditlogRecord2)
}





