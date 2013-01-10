var dataStore = {};

exports.set = function (key, value) {
  dataStore[key] = value;
};

exports.get = function (key) {
  return dataStore[key];
};
