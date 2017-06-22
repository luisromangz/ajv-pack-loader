var g = require('./genError');

module.exports = function genErrorsMissingProperty(keyword, dataPath, fieldPath, index, missingProperty, vErrors) {
  return g(keyword, dataPath, fieldPath, index, {
    missingProperty: missingProperty
  }, vErrors);
};
