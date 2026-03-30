import { cleanupExpiredSessions, cleanupSession } from "@/lib/job-store";

export async function POST(request: Request) {
  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const clientSessionId =
    payload && typeof payload === "object" && "clientSessionId" in payload
      ? (payload as { clientSessionId?: unknown }).clientSessionId
      : undefined;

  if (typeof clientSessionId !== "string" || clientSessionId.trim().length === 0) {
    return Response.json({ error: "clientSessionId is required." }, { status: 400 });
  }

  const { deletedJobs } = cleanupSession(clientSessionId.trim());
  const { expiredSessions, deletedJobs: expiredDeletedJobs } = cleanupExpiredSessions();

  return Response.json({
    ok: true,
    deletedJobs,
    expiredSessions,
    expiredDeletedJobs,
  });
}
