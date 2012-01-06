var express = require('express')
var routes = require('./routes')

var program = require('commander')
program
	.version('0.0.1')
	.usage('<options>')
	.option('-b, --basedir <basedir>', 'Override the audit server basedir. Using -ksrw takes priority over the default basedir relative paths.')
	.option('-k, --keydir <keydir>', 'Override the default keys direcotry user to find users\' public keys.')
	.option('-s, --sandboxdir <sandboxdir>', 'Override the default location that audit server uses to manage sandboxes.')
	.option('-r, --recipedir <recipedir>', 'Override the default location for storing runnable recipes.')
	.option('-w, --whitelistdir <whitelistdir>', 'Override the default location for keeping whitelisted jars (i.e. trusted jars, always OK to schedule).')
	.parse(process.argv)

var bd = program.basedir || __dirname + '/..'

global.auditserver = {
	config : {
		basedir : bd,
		keydir : program.keydir || bd + '/keys/',
		recipedir : program.recipedir || bd + '/recipe-templates/',
		sandboxdir : program.sandboxdir || bd + '/sandbox/',
		whitelistdir : program.whitelistdir || bd + '/whitelist/'
	}
}

console.log('Audit server starting...')
console.log('config = ' + JSON.stringify(auditserver.config, null, 4))

var app = module.exports = express.createServer()

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
})

app.configure('production', function() {
  app.use(express.errorHandler()); 
})

// Main page
app.get('/', routes.index)

//run recipe
app.post('/recipe/:recipe/:user/run', routes.runRecipe)

//challenge - response
app.get('/challenge/:user/:token/:jarname/:sha1', routes.challenge)

app.listen(9090);
console.log("Audit server listening on port %d in %s mode", app.address().port, app.settings.env)

if (process.send) {
	process.send({"status": "running", "port" : app.address().port })
}