var browserify   = require('browserify')
  , browserijade = require('browserijade')
  , fs           = require('fs')
  , sleep        = require('sleep')
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

bundle.on('syntaxError', function (err) {
  console.error(err && err.stack || String(err));
  process.exit(1);
});

log('loading jade views');
bundle.use(browserijade(__dirname + "/../views/public"));

log('running requires');
function addFiles(folder) {
  var files = fs.readdirSync(folder);
  for (var i = 0; i < files.length; ++i) {
    var req = folder + "/" + files[i];
    var stats = fs.statSync(req);
    if (stats.isDirectory()) {
      addFiles(req);
    } else {
      if (files[i].indexOf('.js') !== -1) {
        log('requiring ' + req);
        bundle.require(req);
      }
    }
  }
};
addFiles("./client/requires");

var entry = './client/main.js';
log('adding entry: ' + entry);
bundle.addEntry(entry);

function write() {
  var src = bundle.bundle();
  var outfile = './public/js/app.js';
  log('writing ' + outfile);
  fs.writeFileSync(outfile, src);
};

write();

sleep.sleep(10000000);
