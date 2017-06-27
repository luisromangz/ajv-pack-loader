module.exports = function genErrors(keyword, dataPath, fieldPath, params, vErrors) {
  var err = {
    keyword: keyword,
    dataPath: (dataPath || '') + fieldPath,
    params: params
  };
  if (!vErrors) vErrors = [err];
  else vErrors.push(err);
  return vErrors;
};
