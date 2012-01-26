//var runner = require('../run-recipe.js')
var cp = require('child_process')
var program = require('commander')
var crypto = require('crypto')
var fs = require('fs')

process.env.AUDITSERVER_HADOOP_CONF_DIR = __dirname + '/hadoop-conf-dir'
process.env.AUDITSERVER_USER = 'test-user'
process.env.AUDITSERVER_PRIVATE_KEY = __dirname + '/keys/test-user-private.pem'

function getSignature(data) {
	var sign = crypto.createSign('RSA-SHA256')
	sign.update(data)
	return sign.sign(
		fs.readFileSync(process.env.AUDITSERVER_PRIVATE_KEY, 'ascii'),
		'base64')
}

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.successfullCreateAHttpPostRequest = function(test) {
    test.expect(1)
	
	var path = '/recipe/test-recipe/test-user/run?url=' +
	encodeURIComponent('file://' + __dirname + '/test-dir') +
	'&rev=0'
	
	var data = '{"recipe":"test-recipe","recipevars":{"singleParam":"single","arrayParam":["I","brought","multiple."]},"hconf":{"core":{"fs.default.name":"hdfs://localhost:9000/"},"hdfs":{"dfs.replication":"1","hadoop.tmp.dir":"/tmp/hadoop"},"mapred":{"mapred.job.tracker":"master:8021","mapred.map.tasks.speculative.execution":"false","mapred.output.compress":"true"}}}' 
		
    var expectedUrl = 'curl  -H \'X-AuditSignature:' + getSignature(path + data) + '\' -d \'' + data + '\' \'http://localhost:9090' + path + '\''

	handler = cp.fork(__dirname + '/../run-recipe.js',
						('--filename '+ __dirname + '/test-config.cfg' +
						 ' --svndirectory ' + __dirname + '/test-dir-co').split(' '),
						{ cwd: process.cwd(),
				 		  env: process.env,
				  	      setsid: false
	    				}
	    			)
	handler.on('message', function(m) {
		test.equal(m, expectedUrl, 'Url in curl format must be repeatable.')
	})
	handler.on('exit', 
		function() {
			test.done()
		}
	)
}

exports.successfullCreateALongRunningHttpPostRequest = function(test) {
    test.expect(1)
	
	var path = '/recipe/long-running/test-user/run?url=' +
	encodeURIComponent('file://' + __dirname + '/test-dir') +
	'&rev=0'
	
	var data = '{"recipe":"long-running","recipevars":{"singleParam":"single","arrayParam":["I","brought","multiple."]},"hconf":{"core":{"fs.default.name":"hdfs://localhost:9000/"},"hdfs":{"dfs.replication":"1","hadoop.tmp.dir":"/tmp/hadoop"},"mapred":{"mapred.job.tracker":"master:8021","mapred.map.tasks.speculative.execution":"false","mapred.output.compress":"true"}}}' 
		
    var expectedUrl = 'curl  -H \'X-AuditSignature:' + getSignature(path + data) + '\' -d \'' + data + '\' \'http://localhost:9090' + path + '\''

	handler = cp.fork(__dirname + '/../run-recipe.js',
						('--filename '+ __dirname + '/long-config.cfg' +
						 ' --svndirectory ' + __dirname + '/test-dir-co').split(' '),
						{ cwd: process.cwd(),
				 		  env: process.env,
				  	      setsid: false
	    				}
	    			)
	handler.on('message', function(m) {
		test.equal(m, expectedUrl, 'Url in curl format must be repeatable.')
	})
	handler.on('exit', 
		function() {
			test.done()
		}
	)
}

