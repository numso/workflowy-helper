var mongodb = require('mongodb')
  , mongourl = setupMongo();

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

exports.userExists = function (username, cb) {
  mongodb.connect(mongourl, function (err, conn) {
    if (err) return cb(err);
    conn.collection('users', function (err, coll) {
      if (err) return cb(err);
      coll.findOne({user: username}, function (err, user) {
        if (err) return cb(err);
        if (user) return cb(null, true);
        return cb(null, false);
      });
    });
  });
};

exports.updateUser = function (username, update, cb) {
  mongodb.connect(mongourl, function (err, conn) {
    if (err) return cb(err);
    conn.collection('users', function (err, coll) {
      if (err) return cb(err);
      coll.findAndModify({user: username}, [], {$set: update}, {}, function (err, object) {
        return cb(err);
      });
    });
  });
};

exports.saveNewUser = function (user, cb) {
  mongodb.connect(mongourl, function (err, conn) {
    if (err) return cb(err);
    conn.collection('users', function (err, coll) {
      if (err) return cb(err);
      coll.insert(user, function (err, docs) {
        return cb(err);
      });
    });
  });
};

exports.getUser = function (username, cb) {
  mongodb.connect(mongourl, function (err, conn) {
    if (err) return cb(err);
    conn.collection('users', function (err, coll) {
      if (err) return cb(err);
      coll.findOne({user: username}, function (err, user) {
        return cb(err, user);
      });
    });
  });
};
