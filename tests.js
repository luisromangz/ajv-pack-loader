'use strict';
const test = require('ava');

test('complete', function (t) {
    const validate = require('./testResources/sample.schema.json');
    let result = validate({
        firstName: 'John',
        lastName: 'Doe'
    });
    t.is(result, true);
    t.is(result.errors, undefined);
});

test('merge', function (t) {
    const validate = require('./testResources/merge.schema.json');
    let result = validate({
        firstName: 'John',
        lastName: 'Doe',
        hasJob: 12
    });
    t.is(result, false);
    let expected = {
        keyword: 'type',
        dataPath: '.hasJob',
        schemaPath: '#/properties/hasJob/type',
        params: {
            type: 'boolean'
        },
        message: 'should be boolean'
    };
    t.truthy(validate.errors);
    t.deepEqual(validate.errors[0], expected);
});