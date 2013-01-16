var fs = require('fs');

module.exports = JSON.parse(fs.readFileSync(__dirname + '/common.json', 'utf8'));
