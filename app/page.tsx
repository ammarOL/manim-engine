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

function ToolIcon({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-8 w-8 rounded-full border border-[var(--chat-tool-border)] text-[13px] text-[var(--chat-tool-foreground)] bg-[var(--chat-tool-bg)] hover:bg-white transition-colors"
    >
      {label}
    </button>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
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
    if (!prompt.trim() || isGenerating || isCompiling) return;
    const activeSessionId = clientSessionId || getOrCreateClientSessionId();
    if (!activeSessionId) return;

    const userMessage: ChatMessage = { role: "user", content: prompt.trim() };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setPrompt("");
    setVideoURL("");
    setIsGenerating(true);

    try {
      const response = await axios.post("/api/generate", {
        prompt: userMessage.content,
        history: nextHistory,
        clientSessionId: activeSessionId,
      });

      const code =
        typeof response.data.code === "string" ? response.data.code.trim() : "";
      const generatedVideoUrl =
        typeof response.data.videoUrl === "string"
          ? response.data.videoUrl
          : "";
      const assistantReply =
        typeof response.data.assistantReply === "string"
          ? response.data.assistantReply.trim()
          : "I generated your Manim scene.";

      setResponse(code);
      setCodeDraft(code);
      setVideoURL(generatedVideoUrl);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (error) {
      const fallback =
        axios.isAxiosError(error) &&
        typeof error.response?.data?.assistantReply === "string"
          ? error.response.data.assistantReply
          : "I ran into an issue while generating that scene. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRecompile() {
    if (!codeDraft.trim() || isCompiling || isGenerating) return;
    const activeSessionId = clientSessionId || getOrCreateClientSessionId();
    if (!activeSessionId) return;

    setIsCompiling(true);
    try {
      const response = await axios.post("/api/compile", {
        code: codeDraft,
        clientSessionId: activeSessionId,
      });

      const compiledCode =
        typeof response.data.code === "string" ? response.data.code.trim() : "";
      const compiledVideoUrl =
        typeof response.data.videoUrl === "string"
          ? response.data.videoUrl
          : "";

      setResponse(compiledCode);
      setCodeDraft(compiledCode);
      setVideoURL(compiledVideoUrl);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I recompiled your edited code. The preview on the right is updated.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Recompile failed. Please fix the code and try again.",
        },
      ]);
    } finally {
      setIsCompiling(false);
    }
  }

  return (
    <div className="h-screen bg-[var(--chat-page-bg)] p-3 md:p-4">
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full rounded-3xl border border-[var(--chat-border)] bg-[var(--chat-surface)] shadow-[0_20px_45px_-28px_rgba(35,35,35,0.3)]"
      >
        <ResizablePanel className="h-full w-full min-w-[320px]">
          <div className="flex h-full flex-col p-3 md:p-4">
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
              Manim Chat
            </div>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-history-bg)] p-3 md:p-4">
              {messages.length === 0 ? (
                <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-surface)] p-5 text-center text-sm text-neutral-500">
                  Ask anything about a scene. I will reply conversationally and
                  generate code plus video.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                        message.role === "user"
                          ? "ml-auto bg-[var(--chat-user-bg)] text-white"
                          : "bg-[var(--chat-assistant-bg)] text-[var(--chat-assistant-fg)]"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}

                  {isGenerating ? (
                    <div className="max-w-[88%] rounded-2xl bg-[var(--chat-assistant-bg)] px-4 py-2.5 text-[14px] text-[var(--chat-assistant-fg)]">
                      <span className="animate-pulse">
                        Thinking and rendering...
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="mt-3 rounded-[1.4rem] border border-[var(--chat-border)] bg-[var(--chat-composer-bg)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            >
              <input
                type="text"
                placeholder="Ask anything"
                className="h-10 w-full bg-transparent px-1 text-[15px] text-neutral-800 placeholder:text-neutral-500 outline-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating || isCompiling}
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2"></div>
                <button
                  type="submit"
                  className="h-9 w-9 rounded-xl bg-neutral-900 text-lg text-white transition-opacity disabled:opacity-50"
                  disabled={
                    isGenerating || isCompiling || prompt.trim().length === 0
                  }
                >
                  ↑
                </button>
              </div>
            </form>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel className="m-4">
              <div className="h-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Output Code</div>
                  <button
                    type="button"
                    onClick={handleRecompile}
                    className="px-3 py-1 rounded-md bg-black text-white disabled:opacity-50 text-sm"
                    disabled={
                      isCompiling ||
                      isGenerating ||
                      codeDraft.trim().length === 0
                    }
                  >
                    {isCompiling ? "Recompiling..." : "Recompile"}
                  </button>
                </div>
                <textarea
                  value={codeDraft}
                  onChange={(e) => setCodeDraft(e.target.value)}
                  className="w-full h-full min-h-56 border rounded-md p-3 font-mono text-sm"
                  placeholder="Generated Manim code will appear here. Edit it, then click Recompile."
                  disabled={isCompiling || isGenerating}
                />
                {response.length > 0 ? (
                  <div className="text-xs text-neutral-500">
                    Last successful compile is loaded in the editor.
                  </div>
                ) : null}
              </div>
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel>
              <div className="w-full h-full">
                {videoURL === "" ? (
                  <div className="p-6 text-sm text-neutral-500">
                    Video output will appear here after generation.
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <div className="mx-4 mt-4 mb-4 font-medium">
                      Generated Video
                    </div>
                    <video
                      width="320"
                      height="240"
                      controls
                      className="w-[90%] mx-auto"
                      src={videoURL}
                    />
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
