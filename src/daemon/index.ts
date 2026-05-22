/**
 * Daemon entry point — spawned as a detached child process by `crg daemon start`.
 * Instantiates the Supervisor and runs it until SIGTERM is received.
 */
import { Supervisor } from './supervisor.js';

const supervisor = new Supervisor({
  foreground: false,
});

await supervisor.start();
