module.exports = function genErrors(keyword, dataPath, fieldPath, index, params, vErrors) {
  var err = {
    keyword: keyword,
    dataPath: (dataPath || '') + fieldPath + (index !== -1 ? '[' + index + ']' : ''),
    params: params
  };
  if (!vErrors) vErrors = [err];
  else vErrors.push(err);
  return vErrors;
};