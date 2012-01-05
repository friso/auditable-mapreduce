var recipe = require('../../lib/sandbox/sandbox')

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.howToTestThis = function(test){
    test.expect(1)
	test.ok(false, 'DONT KNOW HOW TO TEST THIS')
	test.done()
}






