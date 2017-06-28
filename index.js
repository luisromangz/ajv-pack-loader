'use strict';
const Ajv = require('ajv');
const pack = require('ajv-pack');
const loaderUtils = require('loader-utils');
const fs = require('fs');
const _ = require('lodash');

function replaceErr(keywords, requiresObj, packedModule) {
  let _replaceErr = function (wholeMatch, keyword, fieldPath, params) {
    keyword = keyword;

    let keywordIdx = keywords.indexOf(keyword);
    if (keywordIdx === -1) {
      keywordIdx = keywords.push(keyword) - 1;
    }

    let paramsMatch;
    let paramsObj = {};
    let paramsRegexp = /\b(.*)\: (.*?),?\n/g;
    while ((paramsMatch = paramsRegexp.exec(params)) !== null) {
      paramsObj[paramsMatch[1]] = paramsMatch[2];
    }

    let funName = 'g';
    let requireFile = 'genError';
    // Instead using the keyword and fieldPath texts (which increases size), we create variables so we can reuse them.
    if (paramsObj.comparison) {
      // Comparison case
      funName = 'gc';
      params = `${paramsObj.comparison},${paramsObj.limit},${paramsObj.exclusive}`;
      requireFile = 'genErrorComparison';
    } else if (paramsObj.type) {
      funName = 'gt';
      params = paramsObj.type;
      requireFile = 'genErrorType';
    } else if (paramsObj.additionalProperty) {
      funName = 'gap';
      params = paramsObj.additionalProperty;
      requireFile = 'genErrorAdditionalProperty';
    }
    requiresObj[funName] = 'ajv-pack-merge-loader/runtime/' + requireFile;

    return `vErrors= ${funName}(k${keywordIdx},dataPath, ${fieldPath},${params},vErrors);`;
  };
  /**
   * We replace inline generation of errors with calls to a genError function.
   */
  let oldPackedModule;
  do {
    oldPackedModule = packedModule;
    packedModule = packedModule.replace(
      /var err = {\n.*\: '(.*)',\n.*\: .*? \+ (.*)?,\n.*\: .*,\n.*\: ({(.*\n)*?.*})\n.*};\n.*\n.*/g,
      _replaceErr);
  } while (oldPackedModule !== packedModule);

  return packedModule;
}

function loadMergePart(instance, schema) {
  if (!schema.$ref || schema.$ref.indexOf('#') === 0) {
    // If it's not a ref or it is a local ref we do nothing.
    return schema;
  }

  return new Promise((resolve, reject) => {
    let refPath = schema.$ref;
    instance.addDependency(schema.$ref);
    instance.resolve(__dirname, refPath, (err, refResolvedPath) => {
      if (err) {
        reject(err);
        return;
      }
      fs.readFile(refResolvedPath, 'utf-8', (err, reffedSchemaJSON) => {
        if (err) {
          reject(err);
          return;
        }
        let reffedSchema = JSON.parse(reffedSchemaJSON);
        resolve(reffedSchema);
      });
    });
  });
}

module.exports = function (source, sourceMap) {
  this.cacheable();

  const query = Object.assign({}, loaderUtils.getOptions(this), {
    sourceCode: true,
    addUsedSchema: false,
    messages: false,
    allErrors: true,
    v5: true
  });

  const callback = this.async();

  // We create a new instance and manually add the schemas as creating the instances
  // outside the exported function and re-using it ends up with errors of readding
  // schemas. 
  const ajv = new Ajv(query);
  //addMerge(ajv);

  let schema = JSON.parse(source);

  let refPromises = [];
  if (schema.$merge) {
    refPromises.push(loadMergePart(this, schema.$merge.source));
    refPromises.push(loadMergePart(this, schema.$merge.with));
  }

  Promise.all(refPromises).then((reffedSchemas) => {
    if (schema.$merge) {
      // We got the schemas in the reffed schemas array and we manually merge them to avoid
      // ajv snafus.
      schema = _.merge({},
        reffedSchemas[0], //source
        reffedSchemas[1], { // with
          id: schema.id
        });
    }

    const validate = ajv.compile(schema);
    let packedModule = pack(ajv, validate);

    // We strip the schema as it is really big.

    // We create a simplified version of the schema so we reduce the bundle's size,
    // while not breaking validation code.
    let simpSchema = {
      properties: {}
    };
    for (let key in schema.properties) {
      simpSchema.properties[key] = 1;
    }

    simpSchema = JSON.stringify(simpSchema);

    packedModule = packedModule.replace(/validate\.schema = ({\n(.*\n)*});/gm, `validate.schema=${simpSchema};`);
    let oldPackedModule;

    let types = [];
    let replaceType = function (wholeMatch, typeName) {
      let typeIndex = types.indexOf(typeName);
      if (typeIndex === -1) {
        typeIndex = types.push(typeName) - 1;
      }
      return `type: t${typeIndex}`;
    };

    do {
      oldPackedModule = packedModule;
      packedModule = packedModule.replace(/type\: \'(.*)\'/g, replaceType);
    } while (oldPackedModule !== packedModule);

    let replaceTypeOfEq = function (wholeMatch, varname, operator, typeName) {
      let typeIndex = types.indexOf(typeName);
      if (typeIndex === -1) {
        typeIndex = types.push(typeName) - 1;
      }
      return `typeof ${varname} ${operator} t${typeIndex}`;
    };
    do {
      oldPackedModule = packedModule;
      packedModule = packedModule.replace(/typeof (.*) (...) "(.*?)"/g, replaceTypeOfEq);
    } while (oldPackedModule !== packedModule);

    let keywords = [];
    let requires = {};
    packedModule = replaceErr(keywords, requires, packedModule);

    // We require the genError function into the module.

    let requiresArray = [];
    for (let requireVar in requires) {
      requiresArray.push(`${requireVar} = require('${requires[requireVar]}')`);
    }
    let requiresStr = 'var ' + requiresArray.join(',') + ';';

    // We add variable declaration for error keywords, dataPaths and types as we reuse them a lot.
    let declareKeywordsStr = keywords.map((keyword, index) => `k${index}='${keyword}'`).join(',');
    let declareTypes = types.map((type, index) => `t${index}='${type}'`).join(',');

    let definitions = [declareKeywordsStr, declareTypes].join(',');

    packedModule = packedModule.replace(/var validate =/,
      `${requiresStr}\nvar ${definitions};\nvar validate = `);

    callback(
      null,
      packedModule,
      sourceMap
    );
  });
};