var g = require('./genError');

module.exports = function genErrorsAdditionalProperty(keyword, dataPath, fieldPath, index, additionalProperty, vErrors) {
  return g(keyword, dataPath, fieldPath, index, {
    additionalProperty: additionalProperty
  }, vErrors);
};
