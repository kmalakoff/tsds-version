import assert from 'assert';
import version from 'tsds-version';

describe('exports .mjs', () => {
  it('defaults', () => {
    assert.equal(typeof version, 'function');
  });
});
