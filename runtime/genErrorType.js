var g = require('./genError');

module.exports = function genErrorsType(keyword, dataPath, fieldPath, type, vErrors) {
  return g(keyword, dataPath, fieldPath, {
    type: type
  }, vErrors);
};
