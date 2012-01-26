var sandbox = require('../../lib/sandbox')
var fs = require('fs')
var childproc = require('child_process')

var box, user, token, rev

global.LOG = new function() {
	this.log = function(string) {}
	this.info = function(string) {}
	this.warn = function(string) {}
	this.debug = function(string) {}
	this.trace = function(string) {}
	this.error = function(string) {}
}

function getRevision(svnDir, callback) {
	childproc.exec(
		'/usr/bin/svn info | grep Revision', 
		{ "cwd" : svnDir },
		function (err, stdout, stderr) {
			callback(stdout)
		}
	)
}

exports.setUp = function(callback) {
	user = 'test-user'
	token = 'UUID1234-TEST-UUID-1234-THISISATESTUUID123'
	rev = '3'
	global.auditserver = {
		config : {
			basedir : __dirname,
			sandboxdir : __dirname + '/test-sandbox-dir'
		}
	}
	
	box = sandbox.createSandbox(token, user, 'file://' + __dirname + '/local-svn-repo/test-repo/', rev)
	callback()
}

exports.tearDown = function(callback) {
	box.cleanup(callback)
}

exports.successfullyCreateAndFillASandboxWithRepoAndRev = function(test){

	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(3)
		test.equal(err, null, 'No error needs to be present')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.equal(statErr, null, 'directory needs to be present!')

			getRevision(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(svnRevision) {
				test.equal(svnRevision, 'Revision: ' + rev + '\n', 'Returned the correct revision')
				test.done()
			})
		})
	}
}

exports.successfullyCreateAndFillASandboxWithRepoAndNoRevision = function(test){

	box.svnRevision = undefined
	var expectedRevision = '3'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(3)
		test.equal(err, null, 'No error needs to be present')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.equal(statErr, null, 'directory needs to be present!')

			getRevision(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(svnRevision) {
			test.equal(svnRevision, 'Revision: ' + expectedRevision + '\n', 'Returned the correct revision')
				test.done()
			})
		})
	}
}

exports.shouldFailOnUnknownSvnUrlWhileCreatingASandbox = function(test) {
	box.svnRepo = __dirname + '/local-svn-repo/not-there/'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(1)
		test.deepEqual(err, { code: 1, msg: 'svn checkout failed.' })
		test.done()
	}
}

exports.shouldFailOnUnknownRevisionWhileCreatingASandbox = function(test) {
	box.svnRevision = '42'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(1)
		test.deepEqual(err, { code: 1, msg: 'svn switch failed.' })
		test.done()
	}
}
