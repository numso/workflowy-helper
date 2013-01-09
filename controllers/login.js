var https = require('https');

exports.init = function(app) {

  app.get('/login',
    app.middleware.isLoggedIn(false),
    app.middleware.render('login/login')
  );

  app.get('/register',
    app.middleware.isLoggedIn(false),
    app.middleware.render('login/register')
  );

  app.get('/logout',
    app.middleware.logout
  );

  app.post('/login',
    app.middleware.login
  );

  app.post('/register',
    app.middleware.register
  );

};

