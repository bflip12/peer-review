// @vitest-environment node
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { startServerIfDown } from "./startServerIfDown";

const servers: Server[] = [];

const getFreePort = async (): Promise<number> => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
};

const listen = async (port: number): Promise<void> => {
  const server = createServer((_request, response) => response.end("ok"));
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(port, resolve));
};

const isUp = async (url: string): Promise<boolean> =>
  fetch(url).then(
    () => true,
    () => false
  );

// A command that serves the given port, standing in for `npm run dev`.
const mockServeCommand = (port: number): string[] => [
  "node",
  "-e",
  `require("node:http").createServer((q, r) => r.end("ok")).listen(${port})`
];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve)))
  );
});

describe("startServerIfDown", () => {
  it("leaves a running server alone and does not run the command", async () => {
    const port = await getFreePort();
    await listen(port);
    const url = `http://localhost:${port}`;

    const stop = await startServerIfDown(url, ["node", "-e", "process.exit(1)"]);
    stop();

    expect(await isUp(url)).toBe(true);
  });

  it("starts the command, waits until it responds, and stops it", async () => {
    const port = await getFreePort();
    const url = `http://localhost:${port}`;

    const stop = await startServerIfDown(url, mockServeCommand(port));
    const upWhileRunning = await isUp(url);
    stop();
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect([upWhileRunning, await isUp(url)]).toEqual([true, false]);
  });

  it("fails when the command exits before the server responds", async () => {
    const port = await getFreePort();
    const url = `http://localhost:${port}`;

    const result = startServerIfDown(url, ["node", "-e", "process.exit(3)"]);

    await expect(result).rejects.toThrow(
      `node -e process.exit(3) exited with code 3 before ${url} responded.`
    );
  });

  it("fails and stops the command when the server does not respond in time", async () => {
    const port = await getFreePort();
    const url = `http://localhost:${port}`;

    const result = startServerIfDown(url, ["node", "-e", "setTimeout(() => {}, 60000)"], {
      timeoutMs: 500
    });

    await expect(result).rejects.toThrow(`${url} did not respond within 500 ms.`);
  });
});
