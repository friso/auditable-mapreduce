var recipe = require('../../lib/recipes')
global.auditserver = {}
global.auditserver['auditlog'] = new function() {
	this.log = function(record) {}
}

exports.shouldCreateAndRunRecipe = function(test) {
	var r = recipe.createRecipe('test-user', 'UUID1234-BLAH-4321', __dirname + '/test-recipe', { singleParam : 'single', arrayParam : ['more', 'stuff']}, __dirname, 'bash')
	var output = ''
	r.on('output', function(data) {
		output += data.out
	})
	r.run(runAsserts)
	
	function runAsserts(err) {
	    test.expect(2)
		test.equal(err, null)
		test.equals(output, 'It works beautifully well!\nsingle\nmore stuff\n', 'Did not create the correct XML!')
		test.done()
	}
}

exports.shouldReturnErrorObjectOnNonZeroExitCode = function(test) {
	var r = recipe.createRecipe('test-user', 'UUID1234-BLAH-4321', __dirname + '/error-recipe', { singleParam : 'single', arrayParam : ['more', 'stuff']}, __dirname, 'bash')
	var output = ''
	r.on('output', function(data) {
		output += data.out
	})
	r.run(runAsserts)
	
	function runAsserts(err) {
	    test.expect(3)
		test.equal(err.code, 42)
		test.equal(err.msg, 'Recipe execution produced a non-zero exit code.')
		test.equals(output, '', 'Did not create the correct XML!')
		test.done()
	}
}
