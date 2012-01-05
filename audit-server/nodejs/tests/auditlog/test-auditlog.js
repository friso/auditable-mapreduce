var auditlog = require('../../lib/auditlog/auditlog')
var fs = require('fs')
var logger, validAuditlogRecord, invalidAuditlogRecord;

exports.setUp = function(callback) {
    logger = auditlog.createAuditlog('/tmp', 'canCreateAnAuditlogFile.log', function(err) {console.log(err)})
    validAuditlogRecord = {
    	"user":"userName"
       ,"token": "uuid-1234"
       ,"identifier" : "RECIPE"
       ,"sequence" : 1
       , "stuff" : { "stuffding1" : "value" }
    }
    invalidAuditlogRecord = {
    	"userr":"userName"
       ,"identifier" : "RECIPE"
       ,"sequence" : 1
    }
	callback()
}

exports.tearDown = function(callback) {
	fs.unlinkSync('/tmp/canCreateAnAuditlogFile.log')
	callback()
}

exports.canCreateAnAuditlogFile = function(test){
    test.expect(1)
    fs.readFile('/tmp/canCreateAnAuditlogFile.log', 'utf8', function (err,data) {
  		if (err) {
  			test.ok(false, 'audit log file NOT correctly created')
  		} else {
  			test.ok(true, 'audit log file correctly created')
  		}
	    test.done()
	})
}

exports.canVerifyACorrectAuditlogRecord = function(test){
    test.expect(1)
    var result = logger.verify(validAuditlogRecord)
    test.equals(result, true, 'audit log record succesfully verified')
    test.done()
}

exports.canVerifyAInCorrectAuditlogRecord = function(test){
    test.expect(1)
    var result = logger.verify(invalidAuditlogRecord)
    test.equals(result, false, 'invalid audit log record succesfully verified')
    test.done()
}

exports.canStringifyACorrectAuditlogRecord = function(test){
    test.expect(1)
    var result = logger.stringify(validAuditlogRecord)
    test.equals(result, '{"user":"userName","token":"uuid-1234","identifier":"RECIPE","sequence":1,"stuff":{"stuffding1":"value"}}\n', 'audit log record succesfully verified')
    test.done()
}

exports.canLogACorrectAuditlogRecord = function(test){
    test.expect(1)
    logger.syslog(validAuditlogRecord)
    logger.syslog(validAuditlogRecord)
    fs.readFile('/tmp/canCreateAnAuditlogFile.log', 'utf8', function (err,data) {
  		if (err) {
  			test.ok(false, 'audit log file NOT correctly written')
  		} else {
  			test.equals(data, '{"user":"userName","token":"uuid-1234","identifier":"RECIPE","sequence":1,"stuff":{"stuffding1":"value"}}\n{"user":"userName","token":"uuid-1234","identifier":"RECIPE","sequence":1,"stuff":{"stuffding1":"value"}}\n', 'audit log file correctly created')
  		}
	    test.done()
	})
}




