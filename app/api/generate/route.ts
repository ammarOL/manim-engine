import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
  RenderExecutionError,
  RenderValidationError,
  renderFromCode,
} from "@/lib/manim-render";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item): item is ChatMessage =>
        !!item &&
        typeof item === "object" &&
        (item as { role?: unknown }).role !== undefined &&
        (item as { content?: unknown }).content !== undefined &&
        ((item as { role: unknown }).role === "user" ||
          (item as { role: unknown }).role === "assistant") &&
        typeof (item as { content: unknown }).content === "string",
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-16);
}

function historyToText(history: ChatMessage[]) {
  if (history.length === 0) return "No previous history.";
  return history
    .map((entry) => `${entry.role === "user" ? "User" : "Assistant"}: ${entry.content}`)
    .join("\n");
}

export async function POST(request: Request) {
  const { prompt, clientSessionId, history } = await request.json();
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }
  const normalizedHistory = normalizeHistory(history);
  const historyText = historyToText(normalizedHistory);

  const { text: assistantReplyRaw } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "You are a helpful assistant for a Manim video generator app. Reply in 2-4 concise sentences and directly answer the user while being friendly. If the user asks for an animation, describe what you'll generate and mention they can edit the code after generation.\n\nConversation so far:\n" +
      historyText +
      "\n\nLatest user message:\n" +
      prompt.trim(),
  });
  const assistantReply = assistantReplyRaw.trim();

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "Your job is to respond with manim code of what the user types in here, reply with the code alone. Rules (do not include in result): do not use self.set_background, instead use self.camera.background_color, Background will be black unless specified." +
      " Include exactly one Scene class: " +
      prompt.trim(),
  });

  try {
    const result = await renderFromCode({
      rawCode: text,
      clientSessionId,
    });
    return Response.json({
      ...result,
      assistantReply,
    });
  } catch (error) {
    if (error instanceof RenderValidationError) {
      return Response.json(
        {
          error: error.message,
          assistantReply:
            assistantReply ||
            "I could not continue because the request payload was incomplete.",
        },
        { status: 400 },
      );
    }
    if (error instanceof RenderExecutionError) {
      return Response.json(
        {
          error: error.message,
          details: error.details,
          assistantReply:
            "I understood your request, but rendering failed this time. Please adjust the prompt or try again.",
        },
        { status: 500 },
      );
    }
    return Response.json(
      {
        error: "Unexpected render failure.",
        details: error instanceof Error ? error.message : String(error),
        assistantReply:
          "I hit an unexpected issue while generating this result. Please try once more.",
      },
      { status: 500 },
    );
  }
}
