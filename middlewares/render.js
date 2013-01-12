exports.init = function (app) {
  app.middleware.render = render;
};

function render(path) {
  return function (req, res, next) {
    res.render(path);
  };
};
