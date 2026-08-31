import assert from 'assert';
import version from 'tsds-version';

describe('exports .ts', () => {
  it('defaults', () => {
    assert.equal(typeof version, 'function');
  });
});
