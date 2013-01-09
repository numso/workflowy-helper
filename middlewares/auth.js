var fs = require('fs');

exports.init = function(app) {
  app.middleware.login = login(app);
  app.middleware.register = register(app);
  app.middleware.logout = logout;
  app.middleware.isLoggedIn = isLoggedIn;
};

function login(app) {
  return function (req, res, next) {
    var users = app.data.users;

    var user = req.body.user;
    var pass = req.body.pass;

    for (var i = 0; i < users.length; ++i) {
      if (users[i].user === user || users[i].email === user) {
        if (users[i].pass === pass) {
          users[i].lastLoginIP = req.connection.remoteAddress;
          fs.writeFileSync('db/users.json', JSON.stringify(app.data.users));
          req.session.user = users[i];
          return res.send({status: 'ok'});
        }
      }
    }

    res.send({status: 'err', msg: 'Incorrect Username / Password'});
  };
};

function register(app) {
  return function (req, res, next) {
    var users = app.data.users
      , user = req.body;

    if (user.rkey !== 'speedyshop1')
      return res.send({status: 'err', msg: 'Wrong Token'});

    for (var i = 0; i < users.length; ++i) {
      if (users[i].user === user.user)
        return res.send({status: 'err', msg: 'Username Taken'});
      if (users[i].email === user.email)
        return res.send({status: 'err', msg: 'Email Taken'});
    }

    delete user.cpass;
    delete user.rkey;

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

    app.data.users.push(user);
    fs.writeFileSync('db/users.json', JSON.stringify(app.data.users));

    req.session.user = user;
    res.send({status: 'ok'});
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
