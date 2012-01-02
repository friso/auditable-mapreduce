exports.index = function(req, res) {
  res.render('index', { "title":"Audit Server" })
};

exports.showRecipe = function(req, res) {
	require('fs').readFile(__dirname + '/../../recipe-templates/' + req.params.recipe, 'utf8', function(err, data) {
		if (err) {
			if (err.code == 'ENOENT') {
				res.writeHead(404, { 'Content-Type':'text/plain'})
				res.end('No such recipe exists: ' + req.params.recipe)
			} else {
				res.writeHead(500, { 'Content-Type':'text/plain'})
				res.end('An error occured:\n' + err)
			}
		} else {
			res.writeHead(200, { 'Content-Type':'text/plain'})
			res.write(data)
			res.end()
		}
	})
}

exports.runRecipe = function(req, res) {
	var recipe = require('../recipes').createRecipe(
		__dirname + '/../../recipe-templates/' + req.params.recipe, 
		{},
		'.',
		'bash',
		function(err) {
			res.end();
		})
	
	recipe.on('output', function(data) { res.write(data) })
	
	res.writeHead(200, { 'Content-Type':'text/plain'})
}
