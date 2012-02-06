var svn = require('../../lib/svn')
var svninfo

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.successfullyGetALocalSvnUrl = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/test-dir-co')
    svninfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(url, 'file://' + __dirname + '/local-svn-repo/test-dir', 'url needs to be the one from local repo')
	    test.done()
	}	
}

exports.successfullyGetASvnRevision = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/test-dir-co')
    svninfo.getRevision(runAsserts)
    
    function runAsserts(err, rev) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(rev, '1', 'rev needs to be the one from local repo')
	    test.done()
	}	
}

exports.dontGetASvnUrlFromNonSvnDir = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/tmp')
    svninfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(url, null, 'url may not be there')
	    test.done()
	}	
}

exports.dontGetASvnrevisionFromNonSvnDir = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/tmp')
    svninfo.getRevision(runAsserts)
    
    function runAsserts(err, rev) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(rev, null, 'rev may not be there')
	    test.done()
	}	
}

exports.dontGetASvnUrlFromNonExistingDir = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/test-non-svn-dir/test-dir-not-there')
    svninfo.getUrl(runAsserts)
    
    function runAsserts(err, url) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(url, null, 'url may not be there')
	    test.done()
	}	
}

exports.dontGetASvnRevisionFromNonExistingDir = function(test){

    test.expect(2)
    
	svninfo = svn.createSvnInfo(__dirname + '/test-non-svn-dir/test-dir-not-there')
    svninfo.getRevision(runAsserts)
    
    function runAsserts(err, rev) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(rev, null, 'rev may not be there')
	    test.done()
	}	
}
