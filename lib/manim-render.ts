import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import {
  buildJobPaths,
  cleanupExpiredSessions,
  registerJobForSession,
  touchSession,
} from "@/lib/job-store";

const execAsync = promisify(exec);

export class RenderValidationError extends Error {}
export class RenderExecutionError extends Error {
  details?: string;

  constructor(message: string, details?: string) {
    super(message);
    this.details = details;
  }
}

export function sanitizeCode(text: string) {
  return text.replace(/```python/g, "").replace(/```/g, "").trim();
}

export function ensureSceneClassName(code: string, sceneClassName: string) {
  const classRegex = /class\s+([A-Za-z_]\w*)\s*\(\s*Scene\s*\)\s*:/;
  if (classRegex.test(code)) {
    return code.replace(classRegex, `class ${sceneClassName}(Scene):`);
  }

  return `from manim import *\n\nclass ${sceneClassName}(Scene):\n    def construct(self):\n        self.camera.background_color = "#000000"\n        pass\n`;
}

type RenderFromCodeInput = {
  rawCode: string;
  clientSessionId: string;
};

export async function renderFromCode({ rawCode, clientSessionId }: RenderFromCodeInput) {
  if (typeof rawCode !== "string" || rawCode.trim().length === 0) {
    throw new RenderValidationError("Code is required.");
  }
  if (typeof clientSessionId !== "string" || clientSessionId.trim().length === 0) {
    throw new RenderValidationError("clientSessionId is required.");
  }

  const sessionId = clientSessionId.trim();
  cleanupExpiredSessions();
  touchSession(sessionId);

  const jobId = crypto.randomUUID();
  const sceneClassName = `Scene_${jobId.replace(/-/g, "_")}`;
  const { sceneFilePath, publicJobDir } = buildJobPaths(jobId);

  const code = ensureSceneClassName(sanitizeCode(rawCode), sceneClassName);
  fs.writeFileSync(sceneFilePath, code, "utf8");

  const mediaDirRelative = path.relative(process.cwd(), publicJobDir);
  const sceneFileRelative = path.relative(process.cwd(), sceneFilePath);
  const command = `python -m manim "${sceneFileRelative}" ${sceneClassName} -ql --media_dir "${mediaDirRelative}"`;

  try {
    await execAsync(command);
  } catch (error) {
    throw new RenderExecutionError(
      "Failed to render video.",
      error instanceof Error ? error.message : String(error),
    );
  }

  const partialPath = path.join(
    publicJobDir,
    "videos",
    "scene",
    "480p15",
    "partial_movie_files",
    sceneClassName,
  );
  fs.rmSync(partialPath, { recursive: true, force: true });

  const videoRelativePath = path.join(
    "jobs",
    jobId,
    "videos",
    "scene",
    "480p15",
    `${sceneClassName}.mp4`,
  );
  const videoAbsolutePath = path.join(process.cwd(), "public", videoRelativePath);
  if (!fs.existsSync(videoAbsolutePath)) {
    throw new RenderExecutionError("Rendered video was not found.");
  }

  registerJobForSession(sessionId, jobId);

  return {
    jobId,
    code,
    videoUrl: `/${videoRelativePath.replaceAll(path.sep, "/")}`,
  };
}
