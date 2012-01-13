var program = require('commander')
var fs = require('fs')
var crypto = require('crypto')

var config = require('./lib/config')
var hconf = require('./lib/hconf')
var git = require('./lib/git')


program
	.version('0.0.1')
	.usage('<options>')
	.option('-f, --filename <filename>', 'The file containing the recipe and variables to use for running.')
	.option('-g, --gitdirectory [gitdrectory]', 'The dir containing the git repo and tree.')
	.option('-h, --host [host]', 'The host to call the url.')
	.parse(process.argv)

program.gitdirectory = program.gitdirectory || process.cwd()
program.host = program.host || 'localhost'

checkInput(createauditServerRequest)

function checkInput(callback) {
	fs.stat(program.filename, function(err, stats) {
		if (err) {
			console.log('Error checking '+program.filename+': '+err)
			exit(1)
		} else {
			if (!stats.isFile()) {
				console.log('Error: '+program.filename+' is not a File')
				exit(1)
			} else {
				fs.stat(program.gitdirectory, function(err, stats) {
					if (err) {
						console.log('Error checking '+program.gitdirectory+': '+err)
						exit(1)
					} else {
						if (!stats.isDirectory()) {
							console.log('Error: '+program.gitdirectory+' is not a Directory')
							exit(1)
						} else {
							fs.stat(process.env.AUDITSERVER_PRIVATE_KEY, function(err, stats) {
								if (err) {
									console.log('Error checking env var AUDITSERVER_PRIVATE_KEY:['+process.env.AUDITSERVER_PRIVATE_KEY+']: '+err)
									exit(1)
								} else {
									if (!stats.isFile()) {
										console.log('Error: env var AUDITSERVER_PRIVATE_KEY:['+process.env.AUDITSERVER_PRIVATE_KEY+'] is not a File')
										exit(1)
									} else {
										fs.stat(process.env.AUDITSERVER_HADOOP_CONF_DIR, function(err, stats) {
											if (err) {
												console.log('Error checking env var AUDITSERVER_HADOOP_CONF_DIR:['+process.env.AUDITSERVER_HADOOP_CONF_DIR+']: '+err)
												exit(1)
											} else {
												if (!stats.isDirectory()) {
													console.log('Error: env var AUDITSERVER_HADOOP_CONF_DIR:['+process.env.AUDITSERVER_HADOOP_CONF_DIR+'] is not a Directory')
													exit(1)
												} else {
													if (!process.env.AUDITSERVER_USER || process.env.AUDITSERVER_USER == '') {
														console.log('Error: env var AUDITSERVER_USER:['+process.env.AUDITSERVER_USER+'] is not valid')
														exit(1)											
													} else {
														callback()
													}
												}
											}
										})
									}
								}
							})
						}
					}
				})
			}
		}
	})
}

function createauditServerRequest() {
	var configuration = config.createConfig(program.filename)

	configuration.parse(function(err, recipeConfig) {
		if (err) {
			console.log(err)
			exit(1)
		} else {
			hadoopConfig = hconf.createConfig(process.env.AUDITSERVER_HADOOP_CONF_DIR)
			hadoopConfig.jsonify(function(err, hadoopConfig) {
				if (err) {
					console.log(err)
					exit(1)
				} else {
					var postData = recipeConfig
					postData['hconf'] = hadoopConfig
					var	gitinfo = git.createGitInfo(program.gitdirectory)
			    	gitinfo.getUrl(function(err, gitUrl) {
						if (err) {
							console.log(err)
							exit(1)
						} else {
							gitinfo.getTree(function(err, gitTree) {
								if (err) {
									console.log(err)
									exit(1)
								} else {
									var signedUrlPart = '/recipe/test-recipe/'+process.env.AUDITSERVER_USER+'/run?url=' +
										encodeURIComponent(gitUrl) +
										'&tree=' +
										gitTree
									var fullUrl = 'http://' + program.host + ':9090' + signedUrlPart
									var data = JSON.stringify(postData)
									var sign = crypto.createSign('RSA-SHA256')
									sign.update(signedUrlPart + data)
									signature = sign.sign(
													fs.readFileSync(process.env.AUDITSERVER_PRIVATE_KEY, 'ascii'),
													'base64'
												)
	
									exit(0, 'curl ' +
										' -H \'X-AuditSignature:' + signature + '\'' +
										' -d \''+data+'\'' +
										' \'' +fullUrl + '\''
									)
								}
				    		})
						}
			    	})
				}
			})
		}
	})
}	

function exit(status, result) {
	if (process.send) {
		if (result) {
			process.send(result)
		}
	}
	if (result) {
		fs.writeFileSync(process.cwd() + '/recipe.result', result, 'utf-8')
		fs.chmodSync(process.cwd() + '/recipe.result', '0766')
	}
	process.exit(status)
}