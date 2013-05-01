var handler

exports.setUp = function(callback) {
	var cp = require('child_process')
	handler = cp.fork(__dirname + '/../lib/handlerprocess/process.js')
	handler.on('message', function(m) {
		switch (m.type) {
			case 'HANDLER_READY_FOR_CONFIG' :
				handler.send({ type : 'CONFIGURATION', 
					config : {
						basedir : __dirname,
						keydir : __dirname + '/keys/',
						recipedir : __dirname + '/recipe-templates/',
						sandboxdir : __dirname + '/sandbox/',
						whitelistdir : __dirname + '/whitelist/'
					},
					node_env : process.env.NODE_ENV
				})
				break
			case 'HANDLER_READY' :
				handler.removeAllListeners()
				callback()
				break
			default :
				console.log('Unexpected message from handler process!')
				process.exit(1)
		}
	})
}

exports.tearDown = function(callback) {
	handler.on('exit', 
	function() {
		console.log("Killed audit server.")
		callback()
	})
	handler.kill()
}

exports.shouldCreateSandboxAndRunRecipeWhenRequested = function(test) {
	var request = {
		type : 'HANDLE_REQUEST',
		token : '01234567-test-0123-0123',
		user : 'test-user',
		svnRepo : ('file://' + __dirname + '/../tests/sandbox/local-svn-repo/test-repo/').replace('integration/../',''),
		svnRevision : '3',
		recipeName : 'conf-recipe',
		recipeVariables : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : {
			core : {
				'fs.default.name' : 'hdfs://localhost:8025/' 
			}
		}
	}

	var output = ''
	
	test.expect(2)
	handler.on('message', function(m) {
		switch(m.type) {
			case 'OUTPUT':
				output += m.out
				break
			case 'REQUEST_END':
				test.equal(
					output,
					'<?xml version="1.0" encoding="UTF-8"?>\n<configuration>\n  <property>\n    <name>fs.default.name</name>\n    <value>hdfs://localhost:8025/</value>\n  </property>\n  <property>\n    <name>auditable.mapreduce.sessionToken</name>\n    <value>01234567-test-0123-0123</value>\n  </property>\n</configuration>\n',
					'Wrong output from recipe!'+output)
				test.equal(m.err, null, 'There was an error where there shouldn\'t be!'
				test.done()
				break;
		}
	})
	
	handler.send(request)
}

exports.shouldRespondWithRequestEndAndPopulatedErrObjectOnUnbuildableSandbox = function(test) {
	var request = {
		type : 'HANDLE_REQUEST',
		token : '01234567-test-0123-0123',
		user : 'test-user',
		svnRepo : ('file://' + __dirname + '/../test/sandbox/local-svn-repo/not-there/').replace('integration/../',''),
		recipeName : 'test-recipe',
		recipeVariables : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : {
			core : {
				'fs.default.name' : 'hdfs://localhost:8035/' 
			}
		}
	}
	
	test.expect(1)
	handler.on('message', function(m) {
		switch(m.type) {
			case 'OUTPUT':
				test.ok(false, 'Should not get any output for non-existing repo.')
				break
			case 'REQUEST_END':
				test.deepEqual(m.err, { code: 1, msg: 'svn checkout failed.' }, 'Expected error not present or matching!')
				test.done()
				break
		}
	})
	
	handler.send(request)
}

exports.shouldCreateSandboxAndRunRecipeWhichCreatesTheFileInHconfDirWhenRequested = function(test) {
	var request = {
		type : 'HANDLE_REQUEST',
		token : '01234567-test-0123-0123',
		user : 'test-user',
		svnRepo : ('file://' + __dirname + '/../tests/sandbox/local-svn-repo/test-repo/').replace('integration/../',''),
		svnRevision : '3',
		recipeName : 'ls-hconf-recipe',
		recipeVariables : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : {
			core : {
				'fs.default.name' : 'hdfs://localhost:8045/' 
			},
			mapred : {
				'some.mapred.var' : 'some.mapred.val' 
			},
			nonstandard : {
				'some.nonstandard.var' : 'some.nonstandard.val' 
			}
		}
	}

	var output = ''
	
	test.expect(2)
	handler.on('message', function(m) {
		switch(m.type) {
			case 'OUTPUT':
				output += m.out
				break
			case 'REQUEST_END':
				test.equal(
					output,
					'hconf/core-site.xml\nhconf/mapred-site.xml\nhconf/nonstandard-site.xml\n',
					'Wrong output from recipe!')
				test.equal(m.err, null, 'There was an error where there shouldn\'t be!')
				test.done()
				break;
		}
	})
	
	handler.send(request)
}


