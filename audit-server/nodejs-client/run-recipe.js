var program = require('commander')
var fs = require('fs')
var crypto = require('crypto')
var http = require('http')

var logFactory = require('./lib/logging')
var config = require('./lib/config')
var hconf = require('./lib/hconf')
var svn = require('./lib/svn')


program
	.version('0.0.1')
	.usage('<options>')
	.option('-f, --filename <filename>', 'The file containing the recipe and variables to use for running.')
	.option('-s, --svndirectory [svndirectory]', 'The dir containing the svn repo and revision.')
	.option('-h, --host [host]', 'The host to call the url.')
	.option('-d, --debug', 'Enable debug logging.')
	.parse(process.argv)

program.svndirectory = program.svndirectory || process.cwd()
program.host = program.host || 'localhost'

global.LOG = logFactory.getLogger(program.debug)

checkInput(createauditServerRequest)

function checkInput(callback) {
	checkFileName(function() {
		checkSvnDirectory(function() {
			checkPrivateKeyFile(function() {
				checkHadoopConfDir(function() {
					checkAuditserverUser(callback)
				})
			})
		})
	})
}

function checkFileName(callback) {
	if (!program.filename) {
		LOG.error("Program started without filename parameter")
		exit(1)
	} else {
		fs.stat(program.filename, function(err, stats) {
			if (err) {
				LOG.error('Error checking '+program.filename+': '+err)
				exit(1)
			} else {
				if (!stats.isFile()) {
					LOG.error('Error: '+program.filename+' is not a File')
					exit(1)
				} else {
					LOG.debug('Using '+program.filename+' as input')
					callback()
				}
			}
		})
	}
}

function checkSvnDirectory(callback) {
	if (!program.svndirectory) {
		LOG.error("Program started without svndirectory parameter")
		exit(1)
	} else {
		fs.stat(program.svndirectory, function(err, stats) {
			if (err) {
				LOG.error('Error checking '+program.svndirectory+': '+err)
				exit(1)
			} else {
				if (!stats.isDirectory()) {
					LOG.error('Error: '+program.svndirectory+' is not a Directory')
					exit(1)
				} else {
					LOG.debug('Using '+program.svndirectory+' as its svn directory')
					callback()
				}
			}
		})
	}
}

function checkPrivateKeyFile(callback) {
	if (!process.env.AUDITSERVER_PRIVATE_KEY) {
		LOG.error('Environment variable AUDITSERVER_PRIVATE_KEY not set')
		exit(1)
	} else {
		fs.stat(process.env.AUDITSERVER_PRIVATE_KEY, function(err, stats) {
			if (err) {
				LOG.error('Error checking env var AUDITSERVER_PRIVATE_KEY:['+process.env.AUDITSERVER_PRIVATE_KEY+']: '+err)
				exit(1)
			} else {
				if (!stats.isFile()) {
					LOG.error('Error: env var AUDITSERVER_PRIVATE_KEY:['+process.env.AUDITSERVER_PRIVATE_KEY+'] is not a File')
					exit(1)
				} else {
					LOG.debug('Using '+process.env.AUDITSERVER_PRIVATE_KEY+' as private key file for signing the request')
					callback()
				}
			}
		})
	}
}

function checkHadoopConfDir(callback) {
	if (!process.env.AUDITSERVER_HADOOP_CONF_DIR) {
		LOG.error('Environment variable AUDITSERVER_HADOOP_CONF_DIR not set')
		exit(1)	
	} else {
		fs.stat(process.env.AUDITSERVER_HADOOP_CONF_DIR, function(err, stats) {
			if (err) {
				LOG.error('Error checking env var AUDITSERVER_HADOOP_CONF_DIR:['+process.env.AUDITSERVER_HADOOP_CONF_DIR+']: '+err)
				exit(1)
			} else {
				if (!stats.isDirectory()) {
					LOG.error('Error: env var AUDITSERVER_HADOOP_CONF_DIR:['+process.env.AUDITSERVER_HADOOP_CONF_DIR+'] is not a Directory')
					exit(1)
				} else {
					LOG.debug('Using '+process.env.AUDITSERVER_HADOOP_CONF_DIR+' as hadoop conf dir')
					callback()
				}
			}
		})
	}
}

function checkAuditserverUser(callback) {
	if (!process.env.AUDITSERVER_USER || process.env.AUDITSERVER_USER == '') {
		LOG.error('Error: env var AUDITSERVER_USER:['+process.env.AUDITSERVER_USER+'] is not valid')
		exit(1)											
	} else {
		LOG.debug('Using '+process.env.AUDITSERVER_USER+' as user for the auditserver request')
		callback()
	}
}

function createauditServerRequest() {
	var configuration = config.createConfig(program.filename)

	configuration.parse(function(err, recipeConfig) {
		if (err) {
			LOG.error(err)
			exit(1)
		} else {
			hadoopConfig = hconf.createConfig(process.env.AUDITSERVER_HADOOP_CONF_DIR)
			hadoopConfig.jsonify(function(err, hadoopConfig) {
				if (err) {
					LOG.error(err)
					exit(1)
				} else {
					var postData = recipeConfig
					postData['hconf'] = hadoopConfig
					var	svninfo = svn.createSvnInfo(program.svndirectory)
			    	svninfo.getUrl(function(err, svnUrl) {
						if (err) {
							LOG.error(err)
							exit(1)
						} else {
							svninfo.getRevision(function(err, revision) {
								if (err) {
									LOG.error(err)
									exit(1)
								} else {
									var port = 9090
									var signedUrlPart = '/recipe/'+recipeConfig.recipe+'/'+process.env.AUDITSERVER_USER+'/run?url=' +
										encodeURIComponent(svnUrl) +
										'&rev=' +
										revision
									var fullUrl = 'http://' + program.host + ':' + port + signedUrlPart
									var data = JSON.stringify(postData)
									var sign = crypto.createSign('RSA-SHA256')
									sign.update(signedUrlPart + data)
									signature = sign.sign(
													fs.readFileSync(process.env.AUDITSERVER_PRIVATE_KEY, 'ascii'),
													'base64'
												)
	
									writeFullRequestToLocalFile(
										'curl ' +
										' -H \'X-AuditSignature:' + signature + '\'' +
										' -d \''+data+'\'' +
										' \'' +fullUrl + '\''									
									)

									var options = {
										host : program.host,
										port : port,
										method: 'POST',
										path : signedUrlPart,
										headers : {'X-AuditSignature' : signature}
									}
									
									doPostRequest(options, data, onEndOfRequest)
									
								}
				    		})
						}
			    	})
				}
			})
		}
	})
}	

function doPostRequest(options, data, callback) {
	var responseData = ''
	var req = http.request(options, function(res) {
		res.on('data', grabData)
		res.on('end', function() { callback(res, responseData) })
	})
	
	req.write(data)
	
	req.end();

	function grabData(d) {
		responseData += d
		process.stdout.write(d)
	}
}

function onEndOfRequest(res, responseData) {
	LOG.info('Run finished with code: '+res.statusCode)
	exit(res.statusCode)
}

function writeFullRequestToLocalFile(result) {
	if (process.send) {
		if (result) {
			process.send(result)
		}
	}
	if (result) {
		fs.writeFileSync(process.cwd() + '/recipe.result', result, 'utf-8')
		fs.chmodSync(process.cwd() + '/recipe.result', '0766')
	}
}

function exit(status) {
	process.exit(status)
}
