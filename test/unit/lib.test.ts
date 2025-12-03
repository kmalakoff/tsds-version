// remove NODE_OPTIONS from ts-dev-stack
delete process.env.NODE_OPTIONS;

// Load test environment before other imports
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.test') });

import assert from 'assert';
import fs from 'fs';
import { linkModule, unlinkModule } from 'module-link-unlink';
import os from 'os';
import osShim from 'os-shim';
import Queue from 'queue-cb';
import * as resolve from 'resolve';
import shortHash from 'short-hash';
import { installGitRepo } from 'tsds-lib-test';

const tmpdir = os.tmpdir || osShim.tmpdir;
const resolveSync = (resolve.default ?? resolve).sync;

import version from 'tsds-version';

const GITS = ['https://github.com/kmalakoff/fetch-http-message.git'];

function addTests(repo) {
  const repoName = path.basename(repo, path.extname(repo));
  describe(repoName, () => {
    const dest = path.join(tmpdir(), 'tsds-version', shortHash(process.cwd()), repoName);
    const modulePath = fs.realpathSync(path.join(__dirname, '..', '..'));
    const modulePackage = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));
    const nodeModules = path.join(dest, 'node_modules');
    const deps = { ...(modulePackage.dependencies || {}), ...(modulePackage.peerDependencies || {}) };

    before((cb) => {
      installGitRepo(repo, dest, (err): undefined => {
        if (err) {
          cb(err);
          return;
        }

        const queue = new Queue();
        queue.defer(linkModule.bind(null, modulePath, nodeModules));
        for (const dep in deps) queue.defer(linkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
        queue.await(cb);
      });
    });
    after((cb) => {
      const queue = new Queue();
      queue.defer(unlinkModule.bind(null, modulePath, nodeModules));
      for (const dep in deps) queue.defer(unlinkModule.bind(null, path.dirname(resolveSync(`${dep}/package.json`)), nodeModules));
      queue.await(cb);
    });

    describe('module', () => {
      it('exports a function', () => {
        assert.equal(typeof version, 'function');
      });
    });

    describe('safeguard', () => {
      it('should block gh-pages publish in test environment without --dry-run', (done) => {
        version([], { cwd: dest }, (err): undefined => {
          assert.ok(err);
          assert.ok(err.message.includes('Cannot publish docs in test environment without --dry-run'));
          done();
        });
      });

      it('should pass safeguard with --dry-run in test environment', function (done) {
        this.timeout(120000); // typedoc can be slow

        version(['--dry-run'], { cwd: dest, stdio: 'inherit' }, (err): undefined => {
          // With --dry-run, the safeguard should NOT trigger
          // The command may fail for other reasons, but not the safeguard
          if (err && err.message.includes('Cannot publish docs in test environment')) {
            done(new Error('Safeguard should not block with --dry-run'));
            return;
          }
          // Any other error (or success) means the safeguard passed
          done();
        });
      });
    });
  });
}

describe('lib', () => {
  for (let i = 0; i < GITS.length; i++) {
    addTests(GITS[i]);
  }
});
