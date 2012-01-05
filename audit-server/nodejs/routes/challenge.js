module.exports = function(req, res) {
	var runner = new ChallengeRunner(req, res)
	runner.run()
}

function ChallengeRunner(request, response) {
	this.request = request
	this.response = response
	this.token = undefined
	this.user = undefined
	this.jarname = undefined
	this.sha1 = undefined
	
	
	var self = this
	
	this.run = function() {
	
		populateFromRequest(request, response)

		function populateFromRequest(req, res) {
			req.on('end' , function() {
				self.user = req.params['user']
				self.token = req.params['token']
				self.jarname = req.params['jarname']
				self.sha1 = req.params['sha1']
				
				response.writeHead(200)
				response.write('Not implemented yet!')
				response.end();
			})
		}
	}
}
