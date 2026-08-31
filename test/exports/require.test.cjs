const assert = require('assert');
const version = require('tsds-version');

describe('exports .cjs', () => {
  it('defaults', () => {
    assert.equal(typeof version, 'function');
  });
});
