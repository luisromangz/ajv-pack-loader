var g = require('./genError');

module.exports = function genErrorComparison(
  keyword, dataPath, fieldPath, index, comparison, limit, exclusive, vErrors) {
  return g(keyword, dataPath, fieldPath, index, {
    comparison: comparison,
    limit: limit,
    exclusive: exclusive
  }, vErrors);
};
