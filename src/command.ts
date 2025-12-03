import spawn from 'cross-spawn-cb';
import getopts from 'getopts-compat';
import Queue from 'queue-cb';
import resolveBin from 'resolve-bin-sync';
import type { CommandCallback, CommandOptions } from 'tsds-lib';
import docs from 'tsds-typedoc';

export default function command(args: string[], options: CommandOptions, callback: CommandCallback): undefined {
  const opts = getopts(args, { alias: { 'dry-run': 'd' }, boolean: ['dry-run'] });

  try {
    const ghPages = resolveBin('gh-pages');
    const queue = new Queue(1);

    // Docs generation is safe - runs locally
    queue.defer(docs.bind(null, args, options));

    // gh-pages is the ONLY destructive operation
    // Safeguard: block in test environment without --dry-run
    if (process.env.NODE_ENV === 'test' && !opts['dry-run']) {
      return callback(new Error('Cannot publish docs in test environment without --dry-run'));
    }

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
