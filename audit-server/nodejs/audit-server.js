var express = require('express')
var routes = require('./routes')

var app = module.exports = express.createServer()

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(__dirname + '/public'))
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

// Main page
app.get('/', routes.index);

//run recipe
app.post('/recipe/:recipe/:user/run', routes.runRecipe)

app.listen(9090);
console.log("Audit server listening on port %d in %s mode", app.address().port, app.settings.env);

process.send({"status": "running", "port" : app.address().port })