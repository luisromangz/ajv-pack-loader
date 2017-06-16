'use strict';
const Ajv = require('ajv');
const pack = require('ajv-pack');
const loaderUtils = require('loader-utils');
//const addMerge = require('ajv-merge-patch');
const fs = require('fs');
const _ = require('lodash');

function loadMergePart(instance, schema) {
  if (!schema.$ref) {
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

module.exports = function(source, sourceMap) {
  this.cacheable();

  const query = Object.assign({}, loaderUtils.getOptions(this), {
    sourceCode: true,
    addUsedSchema: false,
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

  Promise.all(refPromises).then(function(reffedSchemas) {
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
    const packedModule = pack(ajv, validate);
    callback(
      null,
      packedModule,
      sourceMap
    );
  });
};
