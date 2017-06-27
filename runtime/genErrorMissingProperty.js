var g = require('./genError');

module.exports = function genErrorsMissingProperty(keyword, dataPath, fieldPath, missingProperty, vErrors) {
  return g(keyword, dataPath, fieldPath, {
    missingProperty: missingProperty
  }, vErrors);
};
