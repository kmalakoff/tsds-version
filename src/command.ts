import spawn from 'cross-spawn-cb';
import getopts from 'getopts-compat';
import Queue from 'queue-cb';
import resolveBin from 'resolve-bin-sync';
import type { CommandCallback, CommandOptions } from 'tsds-lib';
import docs from 'tsds-typedoc';

export default function command(args: string[], options: CommandOptions, callback: CommandCallback): undefined {
  // Safeguard: block in test environment without --dry-run
  // Check args directly to avoid any potential errors from getopts in old Node versions
  const hasDryRun = args.indexOf('--dry-run') >= 0 || args.indexOf('-d') >= 0;
  if (process.env.NODE_ENV === 'test' && !hasDryRun) {
    return callback(new Error('Cannot publish docs in test environment without --dry-run'));
  }

  try {
    const opts = getopts(args, { alias: { 'dry-run': 'd' }, boolean: ['dry-run'] });
    const ghPages = resolveBin('gh-pages');
    const queue = new Queue(1);

    queue.defer(docs.bind(null, args, options));

    if (!opts['dry-run']) {
      queue.defer(spawn.bind(null, ghPages, ['-d', 'docs'], options));
    } else {
      console.log('Dry-run: would publish docs to GitHub Pages');
    }

    queue.await(callback);
  } catch (err) {
    return callback(err);
  }
}
