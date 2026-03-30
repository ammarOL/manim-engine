import {
  RenderExecutionError,
  RenderValidationError,
  renderFromCode,
} from "@/lib/manim-render";

export async function POST(request: Request) {
  const { code, clientSessionId } = await request.json();

  try {
    const result = await renderFromCode({
      rawCode: code,
      clientSessionId,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof RenderValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof RenderExecutionError) {
      return Response.json(
        { error: error.message, details: error.details },
        { status: 500 },
      );
    }

    return Response.json(
      {
        error: "Unexpected render failure.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
