var g = require('./genError');

module.exports = function genErrorComparison(
  keyword, dataPath, fieldPath, comparison, limit, exclusive, vErrors) {
  return g(keyword, dataPath, fieldPath, {
    comparison: comparison,
    limit: limit,
    exclusive: exclusive
  }, vErrors);
};
