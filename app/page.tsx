"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import axios from "axios";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function getOrCreateClientSessionId() {
  if (typeof window === "undefined") return "";

  const key = "clientSessionId";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;

  const created = uuidv4();
  window.sessionStorage.setItem(key, created);
  return created;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [clientSessionId, setClientSessionId] = useState("");

  useEffect(() => {
    const sessionId = getOrCreateClientSessionId();
    setClientSessionId(sessionId);

    const cleanup = () => {
      const payload = JSON.stringify({ clientSessionId: sessionId });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/generate/cleanup", blob);
    };

    window.addEventListener("pagehide", cleanup);
    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("pagehide", cleanup);
      window.removeEventListener("beforeunload", cleanup);
    };
  }, []);

  async function handleSubmit() {
    if (!prompt.trim() || isSending) return;
    const activeSessionId = clientSessionId || getOrCreateClientSessionId();
    if (!activeSessionId) return;

    const userMessage: ChatMessage = { role: "user", content: prompt.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setVideoURL("");
    setIsSending(true);

    try {
      const response = await axios.post("/api/generate", {
        prompt: userMessage.content,
        clientSessionId: activeSessionId,
      });

      const code =
        typeof response.data.code === "string" ? response.data.code.trim() : "";
      const generatedVideoUrl =
        typeof response.data.videoUrl === "string"
          ? response.data.videoUrl
          : "";

      setResponse(code);
      setVideoURL(generatedVideoUrl);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            code.length > 0
              ? "I generated the code and video. Check the Output Code and Generated Video panels."
              : "I couldn't generate code this time. Try rephrasing your prompt.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong while generating. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="h-screen">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel className="h-full w-full">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-sm text-neutral-500">
                  Ask for a Manim scene and I will generate code and a video.
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "ml-auto bg-black text-white"
                        : "bg-neutral-100 text-neutral-900"
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="w-full border-t p-4 flex gap-2"
            >
              <input
                type="text"
                placeholder="Describe the scene you want..."
                className="border py-2 px-3 rounded-md flex-1"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                }}
                disabled={isSending}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
                disabled={isSending || prompt.trim().length === 0}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel className="m-4">
              <div>
                <div>Output Code</div>
                <div>{response}</div>
              </div>
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel>
              <div className="w-full h-full">
                {videoURL === "" ? (
                  <div>Loading...</div>
                ) : (
                  <div className="w-full h-full">
                    <div className="mx-4 mt-4 mb-4">Generated Video</div>
                    <video
                      width="320"
                      height="240"
                      controls
                      className="w-[90%] mx-auto"
                      src={videoURL}
                    ></video>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
