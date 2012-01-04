var crypto = require('crypto')
var fs = require('fs')

exports.index = function(req, res) {
  res.render('index', { "title":"Audit Server" })
};

exports.runRecipe = function(req, res) {
/*	var recipe = require('../recipes').createRecipe(
		__dirname + '/../../recipe-templates/' + req.params.recipe, 
		{},
		'.',
		'bash',
		function(err) {
			res.end();
		})
	
	recipe.on('output', function(data) { res.write(data) })
	
	res.writeHead(200, { 'Content-Type':'text/plain'})
	*/
	verifyRequest(req, function(result) { 
						res.writeHead(200, { 'Content-Type':'text/plain'})
						res.end('Hello, '+result+' World!')
					   })
}

function verifyRequest(req, callback) {
	var d = '';
	req.on('data', function(data) { d += data })
	req.on('end'
	      , function() {
	      		var requestObject = req.url + d
	      		var signature = req.header('X-AuditSignature')
	      		var userName = req.params['user']
	      		var pem = fs.readFileSync('./keys/cert.pem')
	      		var publicKey = pem.toString('ascii')
      		
	      		var verifier = crypto.createVerify('sha1')
	      		verifier.update(requestObject)
	      		var verified = verifier.verify(publicKey, signature, 'base64')
	      		console.log('got ' + verified)
				callback(verified)
			})
	
}
