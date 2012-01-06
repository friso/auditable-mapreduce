var sandbox = require('../../lib/sandbox/sandbox')
var fs = require('fs')
var removeRecursively = require('rimraf')
var childproc = require('child_process')

var box, user, token, tree

function getGitCommitSha(gitDir, callback) {
	var theCommit = ''
	var show = childproc.execFile(
		'/usr/bin/git show | grep commit', 
		[],
		{ "cwd" : gitDir }
	)
	show.on('data', function(d) { theCommit += d })
	show.on('exit', function() { console.log('in exit, the commit = '+theCommit); callback(theCommit) })
}

exports.setUp = function(callback) {
	user = 'test-user'
	token = 'UUID1234-TEST-UUID-1234-THISISATESTUUID123'
	tree = '8e40a45c79ebf9ca36685e2c228254b87f3d67af'
	global.auditserver = {
		config : {
			basedir : __dirname,
			sandboxdir : __dirname + '/test-sandbox-dir'
		}
	}
	
	box = sandbox.createSandbox(token, user, __dirname + '/local-git-repo/test-repo.git/', tree)
	callback()
}

exports.tearDown = function(callback) {
	fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
		if (!statErr) {
			removeRecursively(global.auditserver.config.sandboxdir + '/' + user + '-' + token, {}, callback)
		} else { 
			callback() 
		}
	})
}

exports.successfullyCreateAndFillASandboxWithRepoAndTree = function(test){

	box.build(runAsserts)
	
	function runAsserts(err, data) {
	    test.expect(4)
		test.strictEqual(err, null, 'No error needs to be present')
		test.equal(data, token, 'Returned the correct token')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.strictEqual(statErr, null, 'directory needs to be present!')

			getGitCommitSha(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(gitCommit) {
				test.equal(gitCommit, tree, 'Returned the correct commit Sha')
				test.done()
			})
		})

	}
}

exports.successfullyCreateAndFillASandboxWithRepoAndNoTree = function(test){

	box.tree = undefined
	var expectedCommitSha = '43cb32934458101b1531d079f54b58aee1ef940b'
	box.build(runAsserts)
	
	function runAsserts(err, data) {
	    test.expect(4)
		test.strictEqual(err, null, 'No error needs to be present')
		test.equal(data, token, 'Returned the correct token')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.strictEqual(statErr, null, 'directory needs to be present!')

			getGitCommitSha(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(gitCommit) {
			test.equal(gitCommit, expectedCommitSha, 'Returned the correct commit Sha')
				test.done()
			})
		})
	}
}

exports.FailOnUnknownOSUserWhileCreatingASandbox = function(test){
	box.user = 'unknown-user'
	box.build(runAsserts)
	
	function runAsserts(err, data) {
	    test.expect(3)
		test.notStrictEqual(err, null, 'Error needs to be present!')
		test.equal(data, 'id: unknown-user: no such user\n', 'Returned wrong error message')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.notStrictEqual(statErr, null, 'Sandbox must not exist')
			test.done()
		})
	}
}


exports.FailOnUnknownGitUrlWhileCreatingASandbox = function(test){
    test.expect(1)
	test.ok(false, 'FailOnUnknownGitUrlWhileCreatingASandbox not implemented yet')
	test.done()
}

exports.FailOnUnknownTreeWhileCreatingASandbox = function(test){
    test.expect(1)
	test.ok(false, 'FailOnUnknownTreeWhileCreatingASandbox not implemented yet')
	test.done()
}






