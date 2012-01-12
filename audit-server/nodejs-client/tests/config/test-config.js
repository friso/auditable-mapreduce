var config = require('../../lib/config')
var fs = require('fs')

var configuration;

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	//process.stdin.destroy()
	callback()
}

exports.successfullyParseAValidConfigFile = function(test){

    test.expect(9)
    
	configuration = config.createConfig(__dirname + '/test-config.cfg')
    configuration.parse(runAsserts)
    
    function runAsserts(err, configObject) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(configObject.recipe, 'test-recipe', 'config must contain a recipe.')
		test.equal(configObject.recipevars.singleParam, 'single', 'config must contain a singleParam.')
		test.deepEqual(configObject.recipevars.arrayParam, ["I", "brought", "multiple."], 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam.length, 3, 'config must contain a arrayParam with 3 elements.')
		test.equal(configObject.recipevars.arrayParam[0], 'I', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[1], 'brought', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[2], 'multiple.', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.userParam, 'test-user', 'config must contain a user name from input.')
		
	    test.done()
	}
}

exports.successfullyParseAValidConfigFileWithUserInput = function(test){

    test.expect(9)
    
	configuration = config.createConfig(__dirname + '/test-config-with-input.cfg')
    configuration.parse(runAsserts)
    
    function runAsserts(err, configObject) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(configObject.recipe, 'test-recipe', 'config must contain a recipe.')
		test.equal(configObject.recipevars.singleParam, 'single', 'config must contain a singleParam.')
		test.deepEqual(configObject.recipevars.arrayParam, ["I", "brought", "multiple."], 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam.length, 3, 'config must contain a arrayParam with 3 elements.')
		test.equal(configObject.recipevars.arrayParam[0], 'I', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[1], 'brought', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[2], 'multiple.', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.userParam, 'test-user', 'config must contain a user name from input.')
		
	    test.done()
	}
}

exports.successfullyParseAValidConfigFileWithMultipleUserInput = function(test){

    test.expect(10)
    
	configuration = config.createConfig(__dirname + '/test-config-with-multiple-input.cfg')
    configuration.parse(runAsserts)
    
    function runAsserts(err, configObject) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(configObject.recipe, 'test-recipe', 'config must contain a recipe.')
		test.equal(configObject.recipevars.singleParam, 'single', 'config must contain a singleParam.')
		test.deepEqual(configObject.recipevars.arrayParam, ["I", "brought", "multiple."], 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam.length, 3, 'config must contain a arrayParam with 3 elements.')
		test.equal(configObject.recipevars.arrayParam[0], 'I', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[1], 'brought', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.arrayParam[2], 'multiple.', 'config must contain a arrayParam.')
		test.equal(configObject.recipevars.userParam, 'test-user', 'config must contain a user name from input.')
		test.equal(configObject.recipevars.userParam2, 'test-user2', 'config must contain a extra user name from input.')
		
	    test.done()
	}
}


exports.dontParseAInvalidConfigFile = function(test){

    test.expect(2)

	configuration = config.createConfig(__dirname + '/invalid-test-config.cfg')
    configuration.parse(runAsserts)
    
    function runAsserts(err, configObject) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(configObject, null, 'config must be null.')

	    test.done()
	}
}

exports.dontParseAUnknownConfigFile = function(test){

    test.expect(2)

	configuration = config.createConfig(__dirname + '/nonexisting-test-config.cfg')
    configuration.parse(runAsserts)
    
    function runAsserts(err, configObject) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(configObject, null, 'config must be null.')

	    test.done()
	}
}
