const { expect } = require('chai');

const { resolveNameAndVersion } = require('../../../src/util/version_resolution');

const workflowDefinitions = [
    {
        name: 'MyWorkflow',
        versions: {
            /* eslint-disable quote-props */
            '1.0': { },
            '1.1': { },
            /* eslint-enable quote-props */
        },
    },
];

describe('resolveNameAndVersion()', () => {
    it('returns max version for name only', () => {
        const found = resolveNameAndVersion(
            { name: 'MyWorkflow' },
            workflowDefinitions
        );
        expect(found).to.deep.equal({
            name: 'MyWorkflow',
            version: '1.1',
        });
    });
    it('can resolve a specific version', () => {
        const found = resolveNameAndVersion(
            { name: 'MyWorkflow', version: '1.0' },
            workflowDefinitions
        );
        expect(found).to.deep.equal({
            name: 'MyWorkflow',
            version: '1.0',
        });
    });
    it('returns undefined when version not found', () => {
        const found = resolveNameAndVersion(
            { name: 'MyWorkflow', version: '2.0' },
            workflowDefinitions
        );
        expect(found).to.be.undefined;
    });
    it('returns undefined when nothing found by name', () => {
        const found = resolveNameAndVersion(
            { name: 'foobar' },
            workflowDefinitions
        );
        expect(found).to.be.undefined;
    });
});
