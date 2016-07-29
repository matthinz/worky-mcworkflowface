const { expect } = require('chai');

const { normalizeNameAndVersion } = require('../../../src/util/name_and_version');

describe('normalizeNameAndVersion()', () => {
    const tests = [
        {
            desc: 'accepts just name',
            input: ['foo'],
            expected: {
                name: 'foo',
                version: undefined,
            },
        },
        {
            desc: 'accepts name and version as separate args',
            input: ['foo', '1.0'],
            expected: {
                name: 'foo',
                version: '1.0',
            },
        },
        {
            desc: 'accepts object with name and version keys',
            input: [{ name: 'foo', version: '2.0' }],
            expected: {
                name: 'foo',
                version: '2.0',
            },
        },
    ];

    tests.forEach(({ desc, input, expected }) => {
        it(desc, () => {
            expect(normalizeNameAndVersion.apply(this, input)).to.deep.equal(expected);
        });
    });
});
