// @vitest-environment node
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RunToolT, ToolNameT } from "./formatEditedFile";
import { formatEditedFile, getEditedFilePath } from "./formatEditedFile";

const mockProjectDir = "/repo";

const mockInput = (filePath: unknown): string =>
  JSON.stringify({
    hook_event_name: "PostToolUse",
    tool_name: "Edit",
    tool_input: { file_path: filePath }
  });

// Stands in for the Prettier, ESLint, and Stylelint processes. Each tool passes unless
// given a result.
const mockRunTool = (
  results: Partial<Record<ToolNameT, { status: number | null; output: string }>> = {}
): Mock<RunToolT> =>
  vi.fn<RunToolT>((tool) => results[tool] ?? { status: 0, output: "" });

describe("getEditedFilePath", () => {
  it("returns the path of a code file inside the project", () => {
    const result = getEditedFilePath(mockInput("/repo/src/app/page.tsx"), mockProjectDir);

    expect(result).toBe("/repo/src/app/page.tsx");
  });

  it("returns JSON and CSS files, which Prettier formats", () => {
    const result = ["/repo/package.json", "/repo/src/app/page.module.css"].map(
      (filePath) => getEditedFilePath(mockInput(filePath), mockProjectDir)
    );

    expect(result).toEqual(["/repo/package.json", "/repo/src/app/page.module.css"]);
  });

  it("skips Markdown and other files the hook does not format", () => {
    const result = ["/repo/TASKS.md", "/repo/public/logo.svg", "/repo/Makefile"].map(
      (filePath) => getEditedFilePath(mockInput(filePath), mockProjectDir)
    );

    expect(result).toEqual([null, null, null]);
  });

  it("skips files outside the project, including a sibling folder with the same prefix", () => {
    const result = ["/elsewhere/page.tsx", "/repo-copy/page.tsx"].map((filePath) =>
      getEditedFilePath(mockInput(filePath), mockProjectDir)
    );

    expect(result).toEqual([null, null]);
  });

  it("skips files inside node_modules", () => {
    const result = getEditedFilePath(
      mockInput("/repo/node_modules/next/dist/index.js"),
      mockProjectDir
    );

    expect(result).toBeNull();
  });

  it("resolves a relative path against the project", () => {
    const result = getEditedFilePath(mockInput("src/app/page.tsx"), mockProjectDir);

    expect(result).toBe("/repo/src/app/page.tsx");
  });

  it("returns null for empty, whitespace, malformed, or pathless input", () => {
    const inputs = [
      "",
      "   ",
      "{not json",
      "null",
      JSON.stringify({ tool_input: {} }),
      mockInput(""),
      mockInput(42)
    ];

    const result = inputs.map((input) => getEditedFilePath(input, mockProjectDir));

    expect(result).toEqual([null, null, null, null, null, null, null]);
  });
});

describe("formatEditedFile", () => {
  it("runs Prettier then ESLint on a TypeScript file and passes when both pass", () => {
    const runTool = mockRunTool();

    const result = formatEditedFile("/repo/src/app/page.tsx", runTool);

    expect(result).toEqual({ exitCode: 0, message: "" });
    expect(runTool.mock.calls).toEqual([
      ["prettier", "/repo/src/app/page.tsx"],
      ["eslint", "/repo/src/app/page.tsx"]
    ]);
  });

  it("runs Prettier then Stylelint on a CSS file", () => {
    const runTool = mockRunTool();

    const result = formatEditedFile("/repo/src/app/page.module.css", runTool);

    expect(result).toEqual({ exitCode: 0, message: "" });
    expect(runTool.mock.calls).toEqual([
      ["prettier", "/repo/src/app/page.module.css"],
      ["stylelint", "/repo/src/app/page.module.css"]
    ]);
  });

  it("runs only Prettier on a file no linter covers", () => {
    const runTool = mockRunTool();

    const result = formatEditedFile("/repo/package.json", runTool);

    expect(result).toEqual({ exitCode: 0, message: "" });
    expect(runTool.mock.calls).toEqual([["prettier", "/repo/package.json"]]);
  });

  it("reports a Prettier failure and skips ESLint, which would fail on the same syntax", () => {
    const runTool = mockRunTool({
      prettier: { status: 2, output: "SyntaxError: (3:1)" }
    });

    const result = formatEditedFile("/repo/src/app/page.tsx", runTool);

    expect(result).toEqual({
      exitCode: 2,
      message: "Prettier could not format /repo/src/app/page.tsx:\nSyntaxError: (3:1)"
    });
    expect(runTool.mock.calls).toEqual([["prettier", "/repo/src/app/page.tsx"]]);
  });

  it("reports ESLint errors that --fix could not fix", () => {
    const runTool = mockRunTool({ eslint: { status: 1, output: "1:1 error no-var" } });

    const result = formatEditedFile("/repo/src/app/page.tsx", runTool);

    expect(result).toEqual({
      exitCode: 2,
      message:
        "ESLint found errors it could not fix in /repo/src/app/page.tsx:\n1:1 error no-var"
    });
  });

  it("reports Stylelint errors that --fix could not fix", () => {
    const runTool = mockRunTool({
      stylelint: {
        status: 2,
        output: "1:8 error scale-unlimited/declaration-strict-value"
      }
    });

    const result = formatEditedFile("/repo/src/app/page.module.css", runTool);

    expect(result).toEqual({
      exitCode: 2,
      message:
        "Stylelint found errors it could not fix in /repo/src/app/page.module.css:\n1:8 error scale-unlimited/declaration-strict-value"
    });
  });

  it("asks for an install when a tool did not start", () => {
    const runTool = mockRunTool({ prettier: { status: null, output: "spawn ENOENT" } });

    const result = formatEditedFile("/repo/src/app/page.tsx", runTool);

    expect(result).toEqual({
      exitCode: 2,
      message:
        "Prettier did not start (spawn ENOENT). Run npm ci, then save the file again."
    });
  });
});

describe("formatEditedFile hook script", () => {
  const projectDir = path.resolve(import.meta.dirname, "../..");
  const scriptPath = path.join(import.meta.dirname, "formatEditedFile.ts");
  const tempPaths: string[] = [];

  // A file in src/, so ESLint applies the project config to it like any app file.
  const writeTempFile = (name: string, content: string): string => {
    const filePath = path.join(projectDir, "src", `hook-test-${process.pid}-${name}`);
    writeFileSync(filePath, content);
    tempPaths.push(filePath);
    return filePath;
  };

  const runScript = (filePath: string): { status: number | null; stderr: string } => {
    const run = spawnSync("node", [scriptPath], {
      input: mockInput(filePath),
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir }
    });
    return { status: run.status, stderr: run.stderr };
  };

  afterEach(() => {
    tempPaths.splice(0).forEach((filePath) => rmSync(filePath, { force: true }));
  });

  it("formats an edited file in place and exits 0", { timeout: 30_000 }, () => {
    const filePath = writeTempFile("format.ts", "export const value = {a:1,b:'two'}\n");

    const result = runScript(filePath);

    expect(result).toEqual({ status: 0, stderr: "" });
    expect(readFileSync(filePath, "utf8")).toBe(
      'export const value = { a: 1, b: "two" };\n'
    );
  });

  it("exits 2 with the ESLint errors on stderr", { timeout: 30_000 }, () => {
    const filePath = writeTempFile(
      "lint.ts",
      "export const read = (value: any) => value;\n"
    );

    const result = runScript(filePath);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("@typescript-eslint/no-explicit-any");
  });

  it("exits 2 on ESLint warnings, which fail CI too", { timeout: 30_000 }, () => {
    const filePath = writeTempFile(
      "warning.tsx",
      'import type { ReactElement } from "react";\n\nexport const Logo = (): ReactElement => <img src="/logo.png" alt="" />;\n'
    );

    const result = runScript(filePath);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("@next/next/no-img-element");
  });

  it("exits 2 with the Stylelint errors on stderr", { timeout: 30_000 }, () => {
    const filePath = writeTempFile(
      "lint.module.css",
      ".wrapper {\n  color: #191816;\n}\n"
    );

    const result = runScript(filePath);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain("scale-unlimited/declaration-strict-value");
  });
});
