var server
var serverPort

var http = require('http')
var crypto = require('crypto')
var fs = require('fs')

function addSignature(options, data) {
	var sign = crypto.createSign('RSA-SHA256')
	sign.update(options.path + data)
	var signature = sign.sign(
		fs.readFileSync(__dirname + '/test-user-private.pem', 'ascii'),
		'base64')
	
	if (options.headers) {
		options.headers['X-AuditSignature'] = signature
	} else {
		options.headers = {'X-AuditSignature' : signature}
	}
}

exports.setUp = function(callback) {
	var cp = require('child_process')
	server = cp.fork(__dirname + '/../audit-server.js')
	server.on('message',
		function(m) {
			serverPort = m.port
			callback()
		})
}

exports.tearDown = function(callback) {
	server.on('exit', 
	function() {
		console.log("Killed audit server.")
		callback()
	})
	server.kill()
}

exports.shouldRunCorrectRecipe = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 200, 'Response code != 200')
		test.equals(resData, 'It works beautifully well!\nsingle\nI brought multiple.', 'Response body doesn not match')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithBadRequestOnMissingHeader = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
		
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 400, 'Response code != 400')
		test.equals(resData, 'Missing signature request header (X-AuditSignature).')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithBadRequestOnWrongSignature = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	if (options.headers) {
		options.headers['X-AuditSignature'] = options.headers['X-AuditSignature'] + 'SPECIMEN'
	}
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resData, 'Signature did not match.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithBadRequestOnMissingData = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 400, 'Response code != 400')
		test.equals(resData, 'Request body contains invalid or missing data.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithBadRequestOnInvalidData = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : [],
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 400, 'Response code != 400')
		test.equals(resData, 'Request body contains invalid or missing data.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithBadRequestOnInvalidQuery = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/test-user/run?tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : {},
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 400, 'Response code != 400')
		test.equals(resData, 'Missing request parameter.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithNotFoundOnUnknownUser = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/test-recipe/unknown-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resData, 'User unknown-user cannot be found on this server.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithNotFoundOnUnknownRecipe = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/unknown-recipe/test-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resData, 'Recipe unknown-recipe cannot be found on this server.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

exports.shouldRespondWithInternalServerErrorOnNonExistingOsUser = function(test) {
	var options = {
		port : serverPort,
		method: 'POST',
		path : '/recipe/unknown-recipe/no-os-user/run?url=' + encodeURIComponent('ssh://git@localhost/~/repo') + '&tree=3a29641aa99c20320f184d2e0108f3ce9005d8f0'
	}
	
	var data = {
		recipevars : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	addSignature(options, JSON.stringify(data))
	
	function runAsserts(res, resData) {
		console.log(resData)
		
	    test.expect(2)
		test.equals(res.statusCode, 500, 'Response code != 500')
		test.equals(resData, 'No such user on os: no-os-user.')
		test.done()
	}
	
	doPostRequest(options, JSON.stringify(data), runAsserts)
}

function doPostRequest(options, data, callback) {
	var responseData = ''
	var req = http.request(options, function(res) {
		res.on('data', grabData)
		res.on('end', function() { callback(res, responseData) })
	})
	
	req.write(data)
	
	req.end();

	function grabData(d) {
		responseData += d
	}
}