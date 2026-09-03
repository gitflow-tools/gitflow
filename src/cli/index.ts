#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Bootstrap } from '../ui/Bootstrap.js';

const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

function enterAlternateScreen(): void {
  if (!isTTY) return;
  process.stdout.write('\x1b[?1049h');
}

function leaveAlternateScreen(): void {
  if (!isTTY) return;
  process.stdout.write('\x1b[?1049l');
}

function hideCursor(): void {
  if (!isTTY) return;
  process.stdout.write('\x1b[?25l');
}

function showCursor(): void {
  if (!isTTY) return;
  process.stdout.write('\x1b[?25h');
}

function clearScreen(): void {
  if (!isTTY) return;
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

let cleanedUp = false;

function cleanup(): void {
  if (cleanedUp) return;
  cleanedUp = true;
  showCursor();
  leaveAlternateScreen();
  process.stdout.write('\x1b[0m');
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });
process.on('uncaughtException', (err) => { cleanup(); throw err; });

async function main(): Promise<void> {
  enterAlternateScreen();
  hideCursor();
  clearScreen();

  render(
    React.createElement(Bootstrap, {
      cwd: process.cwd(),
      termWidth: process.stdout.columns ?? 80,
      termHeight: process.stdout.rows ?? 24,
    }),
  );
}

main().catch(err => {
  cleanup();
  process.stderr.write(`\nFatal error: ${String(err)}\n`);
  process.exit(1);
});
