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
					}
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
		gitRepo : __dirname + '/../tests/sandbox/local-git-repo/test-repo.git/',
		gitTree : '8e40a45c79ebf9ca36685e2c228254b87f3d67af',
		recipeName : 'conf-recipe',
		recipeVariables : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
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
					'<?xml version="1.0" encoding="UTF-8"?>\n<configuration><property><name>fs.default.name</name><value>hdfs://localhost:8020/</value></property><property><name>auditable.mapreduce.sessionToken</name><value>01234567-test-0123-0123</value></property></configuration>\n',
					'Wrong output from recipe!')
				test.equal(m.err, null, 'There was an error where there shouldn\'t be!')
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
		gitRepo : __dirname + '/../test/sandbox/local-git-repo/not-there.git/',
		recipeName : 'test-recipe',
		recipeVariables : { singleParam : 'single', arrayParam : ['I', 'brought', 'multiple.'] },
		hconf : { 'fs.default.name' : 'hdfs://localhost:8020/' }
	}
	
	test.expect(1)
	handler.on('message', function(m) {
		switch(m.type) {
			case 'OUTPUT':
				test.ok(false, 'Should not get any output for non-existing repo.')
				break
			case 'REQUEST_END':
				test.deepEqual(m.err, { code: 128, msg: 'git clone failed.' }, 'Expected error not present or matching!')
				test.done()
				break
		}
	})
	
	handler.send(request)
}
