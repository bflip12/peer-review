// @vitest-environment node
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SCRIPT_PATH = path.join(import.meta.dirname, "takeScreenshots.ts");

// Taller than both viewports, so a full-page capture is taller than the screen.
const PAGE_HEIGHT = 2000;

// The portal stands in for the Next.js dev badge. If the capture showed it, the page would
// be taller than PAGE_HEIGHT.
const mockPage = `<!doctype html><html><body style="margin:0">
  <div style="height:${PAGE_HEIGHT}px">Tall page</div>
  <nextjs-portal style="display:block;height:1000px"></nextjs-portal>
</body></html>`;

// PNG files store width and height as big-endian integers at bytes 16 and 20.
const readPngSize = (filePath: string): { width: number; height: number } => {
  const bytes = readFileSync(filePath);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
};

describe("takeScreenshots", () => {
  let server: Server;
  let baseUrl: string;
  let outputDir: string;

  // Async, because the test server runs in this process and must keep answering.
  const runScript = (
    routes: string[]
  ): Promise<{ status: number | null; stdout: string; stderr: string }> =>
    new Promise((resolve) => {
      const child = spawn("node", [SCRIPT_PATH, ...routes], {
        env: { ...process.env, SCREENSHOT_BASE_URL: baseUrl, SCREENSHOT_DIR: outputDir }
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString()));
      child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
      child.on("close", (status) => resolve({ status, stdout, stderr }));
    });

  beforeAll(async () => {
    server = createServer((_request, response) => {
      response.setHeader("Content-Type", "text/html");
      response.end(mockPage);
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
    outputDir = mkdtempSync(path.join(tmpdir(), "screenshots-"));
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    rmSync(outputDir, { recursive: true, force: true });
  });

  it(
    "saves a full-page capture at 375px and 1280px, without the dev badge",
    { timeout: 60_000 },
    async () => {
      const result = await runScript(["/"]);

      expect(result.status).toBe(0);
      expect(result.stdout.trim().split("\n")).toEqual([
        path.join(outputDir, "home-375.png"),
        path.join(outputDir, "home-1280.png")
      ]);
      expect(readPngSize(path.join(outputDir, "home-375.png"))).toEqual({
        width: 375,
        height: PAGE_HEIGHT
      });
      expect(readPngSize(path.join(outputDir, "home-1280.png"))).toEqual({
        width: 1280,
        height: PAGE_HEIGHT
      });
    }
  );

  it("exits 1 with the usage when no route is given", async () => {
    const result = await runScript([]);

    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: "Give at least one route, for example: npm run screenshot -- /\n"
    });
  });

  it("exits 1 naming the accepted values when --as is unknown", async () => {
    const result = await runScript(["--as=admin", "/"]);

    expect(result).toEqual({
      status: 1,
      stdout: "",
      stderr: 'Unknown --as value "admin". Use --as=user or --as=new.\n'
    });
  });
});
