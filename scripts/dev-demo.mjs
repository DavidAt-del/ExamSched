import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--help') || process.argv.includes('-h');

const commands = [
  { label: 'api', args: ['run', 'dev:api'] },
  { label: 'web', args: ['run', 'dev:web'] },
];

if (dryRun) {
  console.log('Usage: npm run dev:demo');
  console.log('Starts the API and web dev servers concurrently from the repo root.');
  console.log('Commands that would run:');
  for (const command of commands) {
    console.log(`- ${npmCmd} ${command.args.join(' ')}`);
  }
  process.exit(0);
}

const children = commands.map(({ label, args }) => {
  console.log(`[demo] starting ${label}...`);
  return spawn(npmCmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
});

let shuttingDown = false;
const shutdown = (signal = 'SIGTERM') => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  setTimeout(() => process.exit(0), 1000).unref();
};

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (code === 0) return;
    console.error(`[demo] child exited (${signal ?? code ?? 'unknown'}); stopping the other process.`);
    shutdown('SIGTERM');
    process.exit(code ?? 1);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('beforeExit', () => shutdown('SIGTERM'));

