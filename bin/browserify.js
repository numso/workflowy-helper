var browserify   = require('browserify')
  , browserijade = require('browserijade')
  , fs           = require('fs')
  , config       = require('../config')
  ;

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift("\033[0;36m" + "browserify:", "\033[m");
  console.log.apply(console, args);
};

var bundle = browserify({
  watch: false,
  cache: false,
  debug: false
});

log('loading jade views');
bundle.use(browserijade(__dirname + "/../views/public"));

bundle.on('syntaxError', function (err) {
  console.error(err && err.stack || String(err));
  process.exit(1);
});

log('running requires');
for (var i = 0; i < config.browserify.require.length; ++i) {
  var req = config.browserify.require[i];
  if (req.charAt(0) === '/') {
    req = './client' + req;
  }
  log('requiring ' + req);
  bundle.require(req);
}

if (config.browserify.entry) {
  var entry = './client/' + config.browserify.entry;
  log('adding entry: ' + entry);
  bundle.addEntry(entry);
}

function write() {
  var src = bundle.bundle();
  var outfile = './public/js/app.js';
  log('writing ' + outfile);
  fs.writeFileSync(outfile, src);
};

write();
