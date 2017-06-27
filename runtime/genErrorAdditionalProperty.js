var g = require('./genError');

module.exports = function genErrorsAdditionalProperty(keyword, dataPath, fieldPath, additionalProperty, vErrors) {
  return g(keyword, dataPath, fieldPath, {
    additionalProperty: additionalProperty
  }, vErrors);
};
