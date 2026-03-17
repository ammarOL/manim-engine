import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import fs from "fs";
import { exec } from "child_process";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    prompt:
      "Your job is to respond with manim code of what the user types in here, reply with the code alone. Name the scene 'Output': " +
      prompt +
      "do not use self.set_background, instead use self.camera.background_color",
  });

  let message = text
    .replace(/```python/g, "")
    .replace(/```/g, "")
    .trim();
  fs.writeFileSync("python/scene.py", message);

  exec(
    "python -m manim python/scene.py Output -ql --media_dir public",
    (err, stdout, stderr) => {
      console.log(stderr);
    },
  );
  return Response.json({
    message: text,
    videoUrl: "meow",
  });
}
