var https = require('https')
  , fs = require('fs')
  , User = require('../models/user');

exports.init = function(app) {

  app.get('/',
    app.middleware.isLoggedIn(true),
    app.middleware.render('index/index')
  );

  app.get('/settings',
    app.middleware.isLoggedIn(true),
    app.middleware.render('index/settings')
  );

  app.get('/help',
    app.middleware.isLoggedIn(true),
    app.middleware.render('index/help')
  );

  app.post('/updateSettings',
    app.middleware.isLoggedIn(true),
    updateSettings(app)
  );

  app.get('/getWorkflowy',
    app.middleware.isLoggedIn(true),
    getWorkflowy
  );

};

function updateSettings(app) {
  return function (req, res, next) {
    var username = req.session.user.user;
    var newSettings = req.body.settings;

    User.updateUser(username, {settings: newSettings}, function (err) {
      if (err) return res.send({status: 'err', msg: err.msg});
      req.session.user.settings = newSettings;
      res.send('ok');
    });
  };
};

function getWorkflowy(req, res, next) {
  var options = {
    hostname: 'www.workflowy.com',
    path: '/get_project_tree_data?t=' + req.session.user.settings.wfQs,
    method: 'GET',
    headers: {
      Accept: '*/*',
      'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Cookie: req.session.user.settings.wfCookie,
      Host: 'workflowy.com',
      Pragma: 'no-cache',
      Referer: 'https://workflowy.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.101 Safari/537.11'
    }
  };

  var req = https.request(options, function (resp) {
    var d = '';
    resp.on('data', function (data) {
       d += data;
    });

    resp.on('end', function () {
      if (resp.statusCode !== 200)
        return res.send({success: false, err: 'bad cookie'});

      var window = {
        location: {
          host: 'workflowy.com'
        }
      };

      eval(d);
      var datums = window.getProjectTreeData();

      var myObj = {
        success: true,
        workflowy: datums.mainProjectTreeInfo.rootProjectChildren
      };

      if (datums.auxiliaryProjectTreeInfos && datums.auxiliaryProjectTreeInfos.length)
        for (var i = 0; i < datums.auxiliaryProjectTreeInfos.length; ++i)
          myObj.workflowy.push({
            id: datums.auxiliaryProjectTreeInfos[i].rootProject.id,
            nm: datums.auxiliaryProjectTreeInfos[i].rootProject.nm,
            ch: datums.auxiliaryProjectTreeInfos[i].rootProjectChildren
          });

      return res.send(myObj);
    });
  });

  req.on('error', function (e) {
    return res.send({
      success: false,
      err: e
    });
  });

  req.end();
};
