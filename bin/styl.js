var stylus = require('stylus')
  , fs     = require('fs')
  , sleep  = require('sleep')
  , config = require('../config')
  ;

var orig = process.cwd();
process.chdir(config.styl.path);

function log() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift("\033[0;32m" + "stylus:", "\033[m");
  console.log.apply(console, args);
};

function compileFile(file, cb) {
  var str = fs.readFileSync(file, 'utf8');
  stylus(str)
    .render(function (err, css) {
      if (err) return cb(err);
      cb(null, css);
  });
};

function write(style) {
  process.chdir(orig)
  var outfile = config.styl.output;
  log('writing ' + outfile);
  fs.writeFileSync(outfile, style);
};

compileFile(config.styl.entry, function (err, css) {
  if (err) return console.log(err);
  write(css);
  sleep.sleep(10000000);
});
