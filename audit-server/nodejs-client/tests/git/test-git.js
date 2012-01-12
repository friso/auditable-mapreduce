var git = require('../../lib/git')
var gitinfo

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.successfullyGetAGitUrl = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname)
    gitinfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(url, 'git@github.com:friso/auditable-mapreduce.git', 'url needs to be pointing to this repo')
	    test.done()
	}	
}

exports.successfullyGetALocalGitUrl = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/test-git-dir/test')
    gitinfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(url, __dirname + '/local-git-repo/test-dir.git', 'url needs to be the one from local repo')
	    test.done()
	}	
}

exports.successfullyGetAGitTree = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/test-git-dir/test')
    gitinfo.getTree(runAsserts)
    
    function runAsserts(err, tree) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(tree, '7600aec236f786083d18c16141a5eae7774c2a7a', 'tree needs to be the one from local repo')
	    test.done()
	}	
}

exports.dontGetAGitUrlFromNonGitDir = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/tmp')
    gitinfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(url, null, 'url may not be there')
	    test.done()
	}	
}

exports.dontGetAGitTreeFromNonGitDir = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/tmp')
    gitinfo.getTree(runAsserts)
    
    function runAsserts(err, tree) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(tree, null, 'tree may not be there')
	    test.done()
	}	
}

exports.dontGetAGitUrlFromNonExistingDir = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/test-non-git-dir/test-dir-not-there')
    gitinfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(url, null, 'url may not be there')
	    test.done()
	}	
}

exports.dontGetAGitTreeFromNonExistingDir = function(test){

    test.expect(2)
    
	gitinfo = git.createGitInfo(__dirname + '/test-non-git-dir/test-dir-not-there')
    gitinfo.getTree(runAsserts)
    
    function runAsserts(err, tree) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(tree, null, 'tree may not be there')
	    test.done()
	}	
}
