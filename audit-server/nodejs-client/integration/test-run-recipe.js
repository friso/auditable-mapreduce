//var runner = require('../run-recipe.js')
var cp = require('child_process')
var program = require('commander')
process.env.AUDITSERVER_HADOOP_CONF_DIR = __dirname + '/hadoop-conf-dir'
process.env.AUDITSERVER_PRIVATE_KEY = __dirname + '/keys/test-user-private.pem'

exports.setUp = function(callback) {
	callback()
}

exports.tearDown = function(callback) {
	callback()
}

exports.successfullCreateAHttpPostRequest = function(test){
    test.expect(1)
    
    var expectedUrl = 'curl  -H \'X-AuditSignature:btOZmJqWupXzjRB7739AppiNoABlQ/EqUAiqoOsGWIy0Vn8nDS2RdWfj3KToE5tEqWtYcbYfDqYBWurLwNkfbbFd+yNuB1Pf+yhQwoUsyQGWElpWB/MEDRz1OgjfGP+XumNBGTijS9ULudBeVvubYLABmxz02gEgy7hGP7O7qC+97QvcsjUAoI1l6FTjUS24HlfXxu5F2vF9+tUzkIQAAT0Fw1Len8J5RJ+/fb7bQOyVbZw9+CBNlm8gqDHPGPNcbNQEDx3R2fnKxTyxRdiA7Dx4Kd4TBciKNyQHDdKk91igx6UiKqq0TdZCUrOd99/6CvHhrUAljhzcu9UvKfJHeQ==\' ' +
	    '-d \'{"recipe":"test-recipe","recipevars":{"singleParam":"single","arrayParam":["I","brought","multiple."]},"hconf":{"fs.default.name":"hdfs://localhost:9000/","dfs.replication":"1","hadoop.tmp.dir":"/tmp/hadoop","mapred.job.tracker":"master:8021","mapred.map.tasks.speculative.execution":"false","mapred.output.compress":"true"}}\' '+
    	'\'http://localhost:9090'+    	
		'/recipe/test-recipe/test-user/run?url=' +
		encodeURIComponent('/Users/kgeusebroek/dev/rabobank/auditserver/auditable-mapreduce/audit-server/nodejs-client/tests/git/local-git-repo/test-dir.git') +
		'&tree=' +
		'7600aec236f786083d18c16141a5eae7774c2a7a\''

	handler = cp.fork(__dirname + '/../run-recipe.js',
						('--filename '+ __dirname + '/test-config.cfg' +
						 ' --gitdirectory ' + __dirname + '/checkout').split(' '),
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

