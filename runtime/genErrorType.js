var g = require('./genError');

module.exports = function genErrorsType(keyword, dataPath, fieldPath, index, type, vErrors) {
  return g(keyword, dataPath, fieldPath, index, {
    type: type
  }, vErrors);
};
