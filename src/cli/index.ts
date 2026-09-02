#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Bootstrap } from '../ui/Bootstrap.js';

async function main(): Promise<void> {
  render(React.createElement(Bootstrap, { cwd: process.cwd() }));
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${String(err)}\n`);
  process.exit(1);
});