exports.index = function(req, res) {
  res.render('index', { "title":"Audit Server" })
};

exports.runRecipe = require('./runrecipe.js')
