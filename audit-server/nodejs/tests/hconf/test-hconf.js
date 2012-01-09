var hconf = require('../../lib/hconf')
var fs = require('fs')

exports.shouldCreateXmlFileForConfigObject = function(test) {
	hconf.writeHadoopConfiguration({
		'mapred.job.tracker' : 'bnltapp1:8021',
		'mapred.map.tasks.speculative.execution' : false,
		'mapred.output.compress' : 'true'
	}, __dirname + '/core-site.xml', runAsserts)
	
	function runAsserts(err) {
	    test.expect(2)
		test.equal(err, null)
		var content = fs.readFileSync(__dirname + '/core-site.xml', 'utf8')
		var expected = fs.readFileSync(__dirname + '/template.xml', 'utf8')
		test.equals(content, expected, 'Did not create the correct XML!')
		fs.unlinkSync(__dirname + '/core-site.xml')
		test.done()
	}
}
