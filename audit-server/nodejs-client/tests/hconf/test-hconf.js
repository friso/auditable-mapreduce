var config = require('../../lib/hconf')
var fs = require('fs')

var configuration;

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.successfullyCreateAHconfObjectFromXML = function(test){

    test.expect(7)
    
	configuration = config.createConfig(__dirname + '/hadoop-conf-dir')
    configuration.jsonify(runAsserts)
    
    function runAsserts(err, configObject) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(configObject.core['fs.default.name'], 'hdfs://localhost:9000/', 'Defaultname must be hdfs://localhost:9000/')
		test.equal(configObject.hdfs['dfs.replication'], '1', 'Replication must be 1')
		test.equal(configObject.hdfs['hadoop.tmp.dir'], '/tmp/hadoop', 'tmpdir must be /tmp/hadoop')
		test.equal(configObject.mapred['mapred.job.tracker'], 'master:8021', 'Job tracker must be master:8021')
		test.equal(configObject.mapred['mapred.map.tasks.speculative.execution'], 'false', 'speculative exec must be false')
		test.equal(configObject.mapred['mapred.output.compress'], 'true', 'Outputcompression must be true')
	    test.done()
	}	
}


exports.dontParseAnEmptyDir = function(test){

    test.expect(2)

	configuration = config.createConfig(__dirname + '/empty-dir')
    configuration.jsonify(runAsserts)
    
    function runAsserts(err, configObject) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(configObject, null, 'config must be null.')

	    test.done()
	}
}

exports.dontParseANonEmptyDircontainingNoSiteXmlFiles = function(test){

    test.expect(2)

	configuration = config.createConfig(__dirname + '/hadoop-conf-dir-no-site')
    configuration.jsonify(runAsserts)
    
    function runAsserts(err, configObject) {
		test.notEqual(err, null, 'An error needs to be present')
		test.equal(configObject, null, 'config must be null.')

	    test.done()
	}
}

exports.successfullyCreateAHconfObjectFromXMLWithExtraFilesPresent = function(test){

    test.expect(9)
    
	configuration = config.createConfig(__dirname + '/hadoop-conf-dir-extra-site-files')
    configuration.jsonify(runAsserts)
    
    function runAsserts(err, configObject) {
		test.equal(err, null, 'No error needs to be present')
		test.equal(configObject.core['fs.default.name'], 'hdfs://localhost:9000/', 'Defaultname must be hdfs://localhost:9000/')
		test.equal(configObject.hdfs['dfs.replication'], '1', 'Replication must be 1')
		test.equal(configObject.hdfs['hadoop.tmp.dir'], '/tmp/hadoop', 'tmpdir must be /tmp/hadoop')
		test.equal(configObject.mapred['mapred.job.tracker'], 'master:8021', 'Job tracker must be master:8021')
		test.equal(configObject.mapred['mapred.map.tasks.speculative.execution'], 'false', 'speculative exec must be false')
		test.equal(configObject.mapred['mapred.output.compress'], 'true', 'Outputcompression must be true')
		test.equal(configObject.behemoth['gate.annotationset.input'], '', 'Gate annotationset input must be empty but present')
		test.equal(configObject.behemoth['gate.annotationset.output'], 'TestAnnotation', 'Gate annotationset output must be TestAnnotation')
	    test.done()
	}	
}

