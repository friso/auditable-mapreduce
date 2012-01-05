var recipe = require('../../lib/sandbox/sandbox')

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.templateTest = function(test){
    test.expect(1)
	test.ok(true, 'Some message that can be shown')
	test.done()
}






