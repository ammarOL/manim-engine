import fs from "fs";
import path from "path";

const PY_JOBS_ROOT = path.join(process.cwd(), "python", "jobs");
const PUBLIC_JOBS_ROOT = path.join(process.cwd(), "public", "jobs");
const INDEX_PATH = path.join(PY_JOBS_ROOT, "index.json");

export const SESSION_TTL_MS = 20 * 60 * 1000;

type SessionEntry = {
  jobIds: string[];
  lastSeenAt: number;
};

type JobIndex = {
  sessions: Record<string, SessionEntry>;
};

function ensureBaseDirs() {
  fs.mkdirSync(PY_JOBS_ROOT, { recursive: true });
  fs.mkdirSync(PUBLIC_JOBS_ROOT, { recursive: true });
}

function readIndex(): JobIndex {
  ensureBaseDirs();
  if (!fs.existsSync(INDEX_PATH)) {
    return { sessions: {} };
  }

  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<JobIndex>;
    return { sessions: parsed.sessions ?? {} };
  } catch {
    return { sessions: {} };
  }
}

function writeIndex(index: JobIndex) {
  ensureBaseDirs();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf8");
}

function safeRmDir(targetPath: string) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function getSessionJobDirs(jobId: string) {
  return {
    pythonJobDir: path.join(PY_JOBS_ROOT, jobId),
    publicJobDir: path.join(PUBLIC_JOBS_ROOT, jobId),
  };
}

export function registerJobForSession(clientSessionId: string, jobId: string, now = Date.now()) {
  const index = readIndex();
  const existing = index.sessions[clientSessionId];

  if (!existing) {
    index.sessions[clientSessionId] = { jobIds: [jobId], lastSeenAt: now };
  } else {
    existing.jobIds.push(jobId);
    existing.lastSeenAt = now;
  }

  writeIndex(index);
}

export function touchSession(clientSessionId: string, now = Date.now()) {
  const index = readIndex();
  const existing = index.sessions[clientSessionId];

  if (!existing) {
    index.sessions[clientSessionId] = { jobIds: [], lastSeenAt: now };
  } else {
    existing.lastSeenAt = now;
  }

  writeIndex(index);
}

export function cleanupSession(clientSessionId: string) {
  const index = readIndex();
  const entry = index.sessions[clientSessionId];

  if (!entry) {
    return { deletedJobs: 0 };
  }

  let deletedJobs = 0;
  for (const jobId of entry.jobIds) {
    const { pythonJobDir, publicJobDir } = getSessionJobDirs(jobId);
    safeRmDir(pythonJobDir);
    safeRmDir(publicJobDir);
    deletedJobs += 1;
  }

  delete index.sessions[clientSessionId];
  writeIndex(index);

  return { deletedJobs };
}

export function cleanupExpiredSessions(ttlMs = SESSION_TTL_MS, now = Date.now()) {
  const index = readIndex();
  const expiredSessions = Object.entries(index.sessions)
    .filter(([, entry]) => now - entry.lastSeenAt > ttlMs)
    .map(([sessionId]) => sessionId);

  let deletedJobs = 0;
  for (const sessionId of expiredSessions) {
    const entry = index.sessions[sessionId];
    for (const jobId of entry.jobIds) {
      const { pythonJobDir, publicJobDir } = getSessionJobDirs(jobId);
      safeRmDir(pythonJobDir);
      safeRmDir(publicJobDir);
      deletedJobs += 1;
    }
    delete index.sessions[sessionId];
  }

  if (expiredSessions.length > 0) {
    writeIndex(index);
  }

  return {
    expiredSessions: expiredSessions.length,
    deletedJobs,
  };
}

export function buildJobPaths(jobId: string) {
  const pythonJobDir = path.join(PY_JOBS_ROOT, jobId);
  const publicJobDir = path.join(PUBLIC_JOBS_ROOT, jobId);
  const sceneFilePath = path.join(pythonJobDir, "scene.py");

  fs.mkdirSync(pythonJobDir, { recursive: true });
  fs.mkdirSync(publicJobDir, { recursive: true });

  return {
    pythonJobDir,
    publicJobDir,
    sceneFilePath,
  };
}
