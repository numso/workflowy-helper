var https = require('https')
  , fs = require('fs');

exports.init = function(app) {

  app.get('/',
    app.middleware.isLoggedIn(true),
    app.middleware.render('index/index')
  );

  app.get('/settings',
    app.middleware.isLoggedIn(true),
    app.middleware.render('index/settings')
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
    var newSettings = req.body.settings;

    for (var i = 0; i < app.data.users.length; ++i) {
      if (app.data.users[i].id === req.session.user.id) {
        app.data.users[i].settings = newSettings;
        fs.writeFileSync('db/users.json', JSON.stringify(app.data.users));
      }
    }

    req.session.user.settings = newSettings;

    res.send('ok');
  };
};

function getWorkflowy(req, res, next) {
  var options = {
    hostname: 'www.workflowy.com',
    path: '/get_project_tree_data',
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

      eval(d);

      var myObj = {
        success: true,
        workflowy: MAIN_PROJECT_TREE_INFO.rootProjectChildren
      };

      if (AUXILIARY_PROJECT_TREE_INFOS && AUXILIARY_PROJECT_TREE_INFOS.length)
        for (var i = 0; i < AUXILIARY_PROJECT_TREE_INFOS.length; ++i)
          myObj.workflowy.push({
            id: AUXILIARY_PROJECT_TREE_INFOS[i].rootProject.id,
            nm: AUXILIARY_PROJECT_TREE_INFOS[i].rootProject.nm,
            ch: AUXILIARY_PROJECT_TREE_INFOS[i].rootProjectChildren
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
