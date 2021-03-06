var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , MongoStore = require('connect-mongo')(express)
  ;

var app = express();

var sessOptions = {
  key: 'dalspage.sid',
  secret: "6ae0c2595c9d7404b47d6ac70cc7c",
  store: new MongoStore({
    url: setupMongo()
  })
};

function setupMongo() {
  if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
  } else {
    var mongo = {
      "hostname": "localhost",
      "port": 27017,
      "username": "",
      "password": "", 
      "name": "",
      "db": "workflowy"
    };
  }

  var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');

    if (obj.username && obj.password) {
      return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    } else {
      return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
  };

  return generate_mongo_url(mongo);
};

app.configure(function () {
  app.set('port', process.env.VCAP_APP_PORT || process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session(sessOptions));
  app.use(getUser);
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

function getUser(req, res, next) {
  res.locals({user: req.session.user});
  next();
};

function initMiddlewares(path) {
  app.middleware = {};
  initFiles(path, 'middlewares');
};

function initControllers(path) {
  initFiles(path, 'controllers');
};

function initFiles(path, type) {
  path = path || __dirname + '/' + type;
  var files = fs.readdirSync(path);
  console.info('Loading ' + type + ' for path ' + path);

  files.forEach(function(file) {
    var fullPath = path + '/' + file;
    var stats = fs.statSync(fullPath);

    if (stats.isFile()) {
      initFile(app, fullPath, type);
    } else if (stats.isDirectory()) {
      initFiles(fullPath, type);
    }
  });
};

function initFile(app, file, type) {
  var match = /^(.*?\/([A-Za-z_]*))\.js$/.exec(file);
  if (!match) return;
  var asset = require(file);
  if (asset && typeof asset.init === 'function') {
    console.info('    Loading ' + type + ' ' + match[2] + ' (' + file + ')');
    asset.init(app);
  }
};

initMiddlewares();
initControllers();

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});
