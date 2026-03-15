import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt: prompt,
  });

  return Response.json({
    message: text,
  });
}
