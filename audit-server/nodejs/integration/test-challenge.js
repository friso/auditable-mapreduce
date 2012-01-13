var server
var serverPort

var http = require('http')
var fs = require('fs')

exports.setUp = function(callback) {
	var cp = require('child_process')
	server = cp.fork(
		__dirname + '/../audit-server.js', 
		('-b ' + __dirname).split(' '))
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

exports.shouldAcceptCorrectJarInSandbox = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/test-user/bea010bb-58a9-456a-b9bf-c8a495a5a6db/good-jar.jar/a5615894ebbfcf3c56ca003b59cd022c17b0a3aa'
	}
	
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 200, 'Response code != 200')
		test.equals(resObject.result, 'OK', 'Response result does not contain OK')
		test.equals(resObject.reason, 'Found in sandbox.', 'Wrong reason string.')
		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

exports.shouldAcceptWhitelistedJar = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/test-user/bea010bb-58a9-456a-b9bf-c8a495a5a6db/awesome-jar.jar/6dfc6efabcbee66b453db4e19e871c56d0485107'
	}
	
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 200, 'Response code != 200')
		test.equals(resObject.result, 'OK', 'Response result does not contain OK')
		test.equals(resObject.reason, 'Found in whitelist.', 'Wrong reason string.')
		
		fs.unlinkSync(__dirname + '/whitelist/awesome-jar.jar.sha1')

		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

exports.shouldRejectUnknownJar = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/test-user/bea010bb-58a9-456a-b9bf-c8a495a5a6db/non-existing-jar.jar/a5615894ebbfcf3c56ca003b59cd022c17b0a3aa'
	}
		
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resObject.result, 'NOK', 'Response result does not contain NOK')
		test.equals(resObject.reason, 'Jar file not found in any context.', 'Wrong reason string.')
		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

exports.shouldRejectJarWithMismatchingSha1 = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/test-user/bea010bb-58a9-456a-b9bf-c8a495a5a6db/good-jar.jar/a1234567ebbfcf3c56ca1234567d022c17b0a3aa'
	}
		
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 403, 'Response code != 403')
		test.equals(resObject.result, 'NOK', 'Response result does not contain NOK')
		test.equals(resObject.reason, 'Jar SHA1 does not match.', 'Wrong reason string.')
		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

exports.shouldRejectNonExistingToken = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/test-user/01234567-0123-0123-0123-c8a495a5a6db/awesome-jar.jar/6dfc6efabcbee66b453db4e19e871c56d0485107'
	}
		
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resObject.result, 'NOK', 'Response result does not contain NOK')
		test.equals(resObject.reason, 'User or token not found.', 'Wrong reason string.')
		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

exports.shouldRejectJarForWrongUser = function(test) {
	var options = {
		port : serverPort,
		method: 'GET',
		path : '/challenge/git/01234567-0123-0123-0123-c8a495a5a6db/good-jar.jar/a5615894ebbfcf3c56ca003b59cd022c17b0a3aa'
	}
		
	function runAsserts(res, resData) {
		var resObject = JSON.parse(resData)
	    test.expect(3)
		test.equals(res.statusCode, 404, 'Response code != 404')
		test.equals(resObject.result, 'NOK', 'Response result does not contain NOK')
		test.equals(resObject.reason, 'User or token not found.', 'Wrong reason string.')
		test.done()
	}
	
	doGetRequest(options, runAsserts)
}

function doGetRequest(options, callback) {
	var responseData = ''
	var req = http.request(options, function(res) {
		res.on('data', grabData)
		res.on('end', function() { callback(res, responseData) })
	})

	req.end();

	function grabData(d) {
		responseData += d
	}
}