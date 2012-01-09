var sandbox = require('../../lib/sandbox')
var fs = require('fs')
var childproc = require('child_process')

var box, user, token, tree

function getGitCommitSha(gitDir, callback) {
	childproc.exec(
		'/usr/bin/git show | grep commit', 
		{ "cwd" : gitDir },
		function (err, stdout, stderr) {
			callback(stdout)
		}
	)
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
	box.cleanup(callback)
}

exports.successfullyCreateAndFillASandboxWithRepoAndTree = function(test){

	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(3)
		test.equal(err, null, 'No error needs to be present')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.equal(statErr, null, 'directory needs to be present!')

			getGitCommitSha(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(gitCommit) {
				test.equal(gitCommit, 'commit ' + tree + '\n', 'Returned the correct commit Sha')
				test.done()
			})
		})
	}
}

exports.successfullyCreateAndFillASandboxWithRepoAndNoTree = function(test){

	box.gitTree = undefined
	var expectedCommitSha = '43cb32934458101b1531d079f54b58aee1ef940b'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(3)
		test.equal(err, null, 'No error needs to be present')
		
		fs.stat(auditserver.config.sandboxdir+ '/' + user + '-' + token, function(statErr) {
			test.equal(statErr, null, 'directory needs to be present!')

			getGitCommitSha(auditserver.config.sandboxdir + '/' + user + '-' + token + '/checkout/', function(gitCommit) {
			test.equal(gitCommit, 'commit ' + expectedCommitSha + '\n', 'Returned the correct commit Sha')
				test.done()
			})
		})
	}
}

exports.shouldFailOnUnknownGitUrlWhileCreatingASandbox = function(test) {
	box.gitRepo = __dirname + '/local-git-repo/not-there.git/'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(1)
		test.deepEqual(err, { code: 128, msg: 'git clone failed.' })
		test.done()
	}
}

exports.shouldFailOnUnknownTreeWhileCreatingASandbox = function(test) {
	box.gitTree = '43cb32912345671b1531d079f54b58aee1ef940b'
	box.build(runAsserts)
	
	function runAsserts(err) {
	    test.expect(1)
		test.deepEqual(err, { code: 128, msg: 'git checkout failed.' })
		test.done()
	}
}
