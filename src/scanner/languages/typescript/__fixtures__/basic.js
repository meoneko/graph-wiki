import { run } from './runner.js';
const legacy = require('./legacy');

export function start() {
  run();
  legacy.boot();
}
