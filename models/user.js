var mongodb = require('mongodb');

var dbStuffs = setupMongo();
var db = dbStuffs.db;

function setupMongo() {
  if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES)
      , mongo = env['mongodb-1.8'][0]['credentials'];
  } else {
    var mongo = {
      hostname: "localhost",
      port: 27017,
      username: "",
      password: "",
      db: "workflowy"
    }
  }

  var server = new mongodb.Server(mongo.hostname, mongo.port, {});
  var db = new mongodb.Db(mongo.db, server, {w: 1});

  // return cb(db);

  if (!mongo.username && !mongo.password)
    return {db: db};

  return {db: db, username: mongo.username, password: mongo.password};
};

function openDBConnection(cb) {
  db.open(function (err, client) {
    if (err) return cb(err);

    if (dbStuffs.password) {
      client.authenticate(dbStuffs.username, dbStuffs.password, function (err2, data2) {
        if (err2) return cb(err2);
        var coll = new mongodb.Collection(data2, 'users');
        cb(null, coll);
      });
    } else {
      var coll = new mongodb.Collection(client, 'users');
      cb(null, coll);
    }
  });
};

exports.userExists = function (username, cb) {
  openDBConnection(function (err, coll) {
    if (err) return cb(err);

    coll.findOne({user: username}, function (err, user) {
      db.close();
      if (err) return cb(err);
      if (user) return cb(null, true);
      return cb(null, false);
    });
  });
};

exports.updateUser = function (username, update, cb) {
  openDBConnection(function (err, coll) {
    if (err) return cb(err);
    coll.findAndModify({user: username}, [], {$set: update}, {}, function (err, object) {
      db.close();
      return cb(err);
    });
  });
};

exports.saveNewUser = function (user, cb) {
  openDBConnection(function (err, coll) {
    if (err) return cb(err);

    coll.insert(user, function (err, docs) {
      db.close();
      return cb(err);
    });
  });
};

exports.getUser = function (username, cb) {
  openDBConnection(function (err, coll) {
    if (err) return cb(err);

    coll.findOne({user: username}, function (err, user) {
      db.close();
      return cb(err, user);
    });
  });
};
