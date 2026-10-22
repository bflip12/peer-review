import { spawn } from "node:child_process";

import {
  SERVER_POLL_INTERVAL_MS,
  SERVER_START_TIMEOUT_MS
} from "./screenshot.constants.ts";

/** Stops the server `startServerIfDown` started. Does nothing when it reused one. */
export type StopServerT = () => void;

type OptionsT = { timeoutMs?: number };

const responds = async (url: string): Promise<boolean> =>
  fetch(url).then(
    () => true,
    () => false
  );

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Resolves once something answers at `baseUrl`. When nothing does, runs `command` in its
 * own process group and polls until it answers. The returned function stops that group,
 * so a server the command forks (as `npm run dev` forks `next dev`) stops too. Rejects
 * when the command exits first or the server does not answer within the timeout.
 */
export const startServerIfDown = async (
  baseUrl: string,
  command: string[],
  { timeoutMs = SERVER_START_TIMEOUT_MS }: OptionsT = {}
): Promise<StopServerT> => {
  if (await responds(baseUrl)) return () => {};

  const [program, ...args] = command;
  const child = spawn(program, args, { detached: true, stdio: "ignore" });
  let exitCode: number | null = null;
  let exited = false;
  child.on("exit", (code) => {
    exited = true;
    exitCode = code;
  });

  const stop: StopServerT = () => {
    if (exited || child.pid === undefined) return;
    // A negative pid signals the whole process group the detached child leads.
    process.kill(-child.pid, "SIGTERM");
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await responds(baseUrl)) return stop;
    if (exited) {
      throw new Error(
        `${command.join(" ")} exited with code ${exitCode} before ${baseUrl} responded.`
      );
    }
    await wait(SERVER_POLL_INTERVAL_MS);
  }
  stop();
  throw new Error(`${baseUrl} did not respond within ${timeoutMs} ms.`);
};
