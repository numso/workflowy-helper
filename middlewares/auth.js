var fs = require('fs'),
    User = require('../models/user')
  , bcrypt = require('bcrypt');

exports.init = function(app) {
  app.middleware.login = login(app);
  app.middleware.register = register(app);
  app.middleware.logout = logout;
  app.middleware.isLoggedIn = isLoggedIn;
};

function login(app) {
  return function (req, res, next) {
    var username = req.body.user
      , pass = req.body.pass;

    User.getUser(username, function (err, user) {
      if (err) return res.send({status: "err", msg: err.msg});
      if (!user) return res.send({status: 'err', msg: 'Incorrect Username'});

      // if (bcrypt.compareSync(pass, user.pass)) {
      if (pass === user.pass) {
        user.lastLoginIP = req.connection.remoteAddress;
        req.session.user = user;
        User.updateUser(user.user, {lastLoginIP: user.lastLoginIP}, function (){});
        return res.send({status: 'ok'});
      }

      return res.send({status: 'err', msg: 'Incorrect Password'});
    });
  };
};

function register(app) {
  return function (req, res, next) {
    var user = req.body;

    if (user.rkey !== 'speedyshop1')
      return res.send({status: 'err', msg: 'Wrong Token'});


    User.userExists(user.user, function (err, exists) {
      if (exists) return res.send({status: 'err', msg: 'Username Taken'});

      finishRegister();
    });

    function finishRegister() {
      delete user.cpass;
      delete user.rkey;

      // var salt = bcrypt.genSaltSync(10);
      // user.pass = bcrypt.hashSync(user.pass, salt);

      user.settings = {
        showCalendar: 'true',
        wfCookie: '',
        wfLabels: [
          {
            name: 'Homework',
            id: '#hw'
          },
          {
            name: 'Tests',
            id: '#test'
          },
          {
            name: 'Todo',
            id: '#todo'
          }
        ]
      };

      user.id = Date.now() + "" + Math.floor(Math.random() * 1000 + 1);
      user.lastLoginIP = req.connection.remoteAddress;

      User.saveNewUser(user, function (err) {
        if (err) return res.send({status: 'err', msg: err.msg});
        req.session.user = user;
        res.send({status: 'ok'});
      });
    };
  };
};

function logout(req, res, next) {
  req.session.destroy(function () {
    res.redirect('/login');
  });
};

function isLoggedIn(loggedIn, path) {
  path = path || loggedIn ? '/login' : '/';

  return function (req, res, next) {
    if (!!req.session.user !== loggedIn)
      return res.redirect(path);

    next();
  };
};
