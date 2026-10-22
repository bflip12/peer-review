import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The tools the hook runs, by the name of their binary in `node_modules/.bin`. */
export type ToolNameT = "prettier" | "eslint";

/** How a tool run ended. `status` is null when the process did not start or was killed. */
export type ToolRunT = { status: number | null; output: string };

/** Runs one tool on one file. Injected so tests can stand in for the real processes. */
export type RunToolT = (tool: ToolNameT, filePath: string) => ToolRunT;

/** Exit code and stderr text for Claude Code. Exit 2 shows the message to Claude. */
export type HookResultT = { exitCode: 0 | 2; message: string };

// Files Prettier formats. Markdown is left out because the docs are wrapped by hand.
const FORMATTED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css"
];

// Files ESLint lints after Prettier formats them.
const LINTED_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];

const TOOL_LABELS: Record<ToolNameT, string> = { prettier: "Prettier", eslint: "ESLint" };

const TOOL_ARGS: Record<ToolNameT, string[]> = {
  // --ignore-unknown skips a file with no parser; .prettierignore still applies.
  prettier: ["--write", "--ignore-unknown", "--log-level", "warn"],
  // --no-warn-ignored keeps files in the ESLint ignore list from printing a warning.
  eslint: ["--fix", "--no-warn-ignored"]
};

const readFilePath = (rawInput: string): unknown => {
  try {
    const input: unknown = JSON.parse(rawInput);
    if (typeof input !== "object" || input === null || !("tool_input" in input)) {
      return null;
    }
    const toolInput = input.tool_input;
    if (typeof toolInput !== "object" || toolInput === null) return null;
    return "file_path" in toolInput ? toolInput.file_path : null;
  } catch {
    return null;
  }
};

/**
 * Reads the edited file's absolute path from PostToolUse hook input. Returns null when the
 * input is not valid JSON, has no path, or names a file the hook should leave alone: outside
 * `projectDir`, inside `node_modules`, or not a type Prettier formats here.
 */
export const getEditedFilePath = (
  rawInput: string,
  projectDir: string
): string | null => {
  const filePath = readFilePath(rawInput);
  if (typeof filePath !== "string" || filePath.trim() === "") return null;

  const absolutePath = path.resolve(projectDir, filePath);
  const relativePath = path.relative(projectDir, absolutePath);
  const isOutside = relativePath.startsWith("..") || path.isAbsolute(relativePath);
  if (isOutside || relativePath.split(path.sep).includes("node_modules")) return null;

  return FORMATTED_EXTENSIONS.includes(path.extname(absolutePath)) ? absolutePath : null;
};

/**
 * Formats a file with Prettier, then fixes it with ESLint when ESLint lints that type.
 * Stops at the first tool that fails and returns exit code 2 with that tool's output, so
 * Claude sees the errors right after its edit. Expects a path from `getEditedFilePath`.
 */
export const formatEditedFile = (filePath: string, runTool: RunToolT): HookResultT => {
  const tools: ToolNameT[] = LINTED_EXTENSIONS.includes(path.extname(filePath))
    ? ["prettier", "eslint"]
    : ["prettier"];

  for (const tool of tools) {
    const run = runTool(tool, filePath);
    const label = TOOL_LABELS[tool];
    if (run.status === null) {
      return {
        exitCode: 2,
        message: `${label} did not start (${run.output}). Run npm ci, then save the file again.`
      };
    }
    if (run.status !== 0) {
      const problem =
        tool === "eslint"
          ? `ESLint found errors it could not fix in ${filePath}`
          : `${label} could not format ${filePath}`;
      return { exitCode: 2, message: `${problem}:\n${run.output.trim()}` };
    }
  }
  return { exitCode: 0, message: "" };
};

const createRunTool =
  (projectDir: string): RunToolT =>
  (tool, filePath) => {
    const binary = path.join(projectDir, "node_modules", ".bin", tool);
    const run = spawnSync(binary, [...TOOL_ARGS[tool], filePath], {
      cwd: projectDir,
      encoding: "utf8"
    });
    if (run.error) return { status: null, output: run.error.message };
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  };

const main = (): void => {
  const rawInput = readFileSync(0, "utf8");
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const filePath = getEditedFilePath(rawInput, projectDir);
  if (filePath === null) return;

  const result = formatEditedFile(filePath, createRunTool(projectDir));
  if (result.message !== "") process.stderr.write(`${result.message}\n`);
  process.exitCode = result.exitCode;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
