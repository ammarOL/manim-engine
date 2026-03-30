import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import {
  buildJobPaths,
  cleanupExpiredSessions,
  registerJobForSession,
  touchSession,
} from "@/lib/job-store";

const execAsync = promisify(exec);

function sanitizeCode(text: string) {
  return text.replace(/```python/g, "").replace(/```/g, "").trim();
}

function ensureSceneClassName(code: string, sceneClassName: string) {
  const classRegex = /class\s+([A-Za-z_]\w*)\s*\(\s*Scene\s*\)\s*:/;
  if (classRegex.test(code)) {
    return code.replace(classRegex, `class ${sceneClassName}(Scene):`);
  }

  return `from manim import *\n\nclass ${sceneClassName}(Scene):\n    def construct(self):\n        self.camera.background_color = "#000000"\n        pass\n`;
}

export async function POST(request: Request) {
  const { prompt, clientSessionId } = await request.json();
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }
  if (typeof clientSessionId !== "string" || clientSessionId.trim().length === 0) {
    return Response.json({ error: "clientSessionId is required." }, { status: 400 });
  }

  const sessionId = clientSessionId.trim();
  cleanupExpiredSessions();
  touchSession(sessionId);

  const jobId = crypto.randomUUID();
  const sceneClassName = `Scene_${jobId.replace(/-/g, "_")}`;
  const { sceneFilePath, publicJobDir } = buildJobPaths(jobId);

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "Your job is to respond with manim code of what the user types in here, reply with the code alone. Rules (do not include in result): do not use self.set_background, instead use self.camera.background_color, Background will be black unless specified. Name the scene '" +
      sceneClassName +
      "': " +
      prompt.trim(),
  });

  const rawCode = sanitizeCode(text);
  const code = ensureSceneClassName(rawCode, sceneClassName);
  fs.writeFileSync(sceneFilePath, code, "utf8");

  const mediaDirRelative = path.relative(process.cwd(), publicJobDir);
  const sceneFileRelative = path.relative(process.cwd(), sceneFilePath);
  const command = `python -m manim "${sceneFileRelative}" ${sceneClassName} -ql --media_dir "${mediaDirRelative}"`;

  try {
    await execAsync(command);
  } catch (error) {
    return Response.json(
      {
        error: "Failed to render video.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
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
    return Response.json({ error: "Rendered video was not found." }, { status: 500 });
  }

  registerJobForSession(sessionId, jobId);

  return Response.json({
    jobId,
    code,
    videoUrl: `/${videoRelativePath.replaceAll(path.sep, "/")}`,
  });
}
