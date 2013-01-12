exports.init = function (app) {

  app.get('/',
    app.middleware.render('index/index')
  );

};
