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

type MobileView = "chat" | "code" | "video";

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
  const [codeDraft, setCodeDraft] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [clientSessionId, setClientSessionId] = useState("");
  const [activeMobileView, setActiveMobileView] = useState<MobileView>("chat");

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

  function renderChatPanel() {
    return (
      <div className="flex h-full min-h-0 flex-col p-2.5 md:p-4">
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
          Manim Chat
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-history-bg)] p-3 md:p-4">
          {messages.length === 0 ? (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-surface)] p-4 text-center text-sm text-neutral-500 md:mt-12 md:p-5">
              Ask anything about a scene. I will reply conversationally and
              generate code plus video.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm md:max-w-[88%] md:px-4 ${
                    message.role === "user"
                      ? "ml-auto bg-[var(--chat-user-bg)] text-white"
                      : "bg-[var(--chat-assistant-bg)] text-[var(--chat-assistant-fg)]"
                  }`}
                >
                  {message.content}
                </div>
              ))}

              {isGenerating ? (
                <div className="max-w-[92%] rounded-2xl bg-[var(--chat-assistant-bg)] px-3.5 py-2.5 text-[14px] text-[var(--chat-assistant-fg)] md:max-w-[88%] md:px-4">
                  <span className="animate-pulse">Thinking and rendering...</span>
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
          className="mt-2.5 rounded-[1.25rem] border border-[var(--chat-border)] bg-[var(--chat-composer-bg)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] md:mt-3 md:rounded-[1.4rem] md:p-3"
        >
          <input
            type="text"
            placeholder="Ask anything"
            className="h-10 w-full bg-transparent px-1 text-[15px] text-neutral-800 placeholder:text-neutral-500 outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating || isCompiling}
          />

          <div className="mt-2 flex items-center justify-end">
            <button
              type="submit"
              className="h-9 w-9 rounded-xl bg-neutral-900 text-lg text-white transition-opacity disabled:opacity-50"
              disabled={isGenerating || isCompiling || prompt.trim().length === 0}
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    );
  }

  function renderCodePanel(isMobile: boolean) {
    return (
      <div
        className={`h-full flex flex-col gap-3 ${isMobile ? "rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-history-bg)] p-3" : ""}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="font-medium">Output Code</div>
          <button
            type="button"
            onClick={handleRecompile}
            className="rounded-md bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
            disabled={isCompiling || isGenerating || codeDraft.trim().length === 0}
          >
            {isCompiling ? "Recompiling..." : "Recompile"}
          </button>
        </div>
        <textarea
          value={codeDraft}
          onChange={(e) => setCodeDraft(e.target.value)}
          className="h-full min-h-[45vh] w-full rounded-md border p-3 font-mono text-sm md:min-h-56"
          placeholder="Generated Manim code will appear here. Edit it, then click Recompile."
          disabled={isCompiling || isGenerating}
        />
        {response.length > 0 ? (
          <div className="text-xs text-neutral-500">
            Last successful compile is loaded in the editor.
          </div>
        ) : null}
      </div>
    );
  }

  function renderVideoPanel(isMobile: boolean) {
    return (
      <div
        className={`h-full w-full ${isMobile ? "rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-history-bg)] p-3" : ""}`}
      >
        {videoURL === "" ? (
          <div className="p-3 text-sm text-neutral-500 md:p-6">
            Video output will appear here after generation.
          </div>
        ) : (
          <div className="h-full w-full">
            <div className="mb-3 font-medium md:mx-4 md:mt-4 md:mb-4">
              Generated Video
            </div>
            <video
              controls
              className="h-auto w-full rounded-xl md:w-[90%] md:mx-auto"
              src={videoURL}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--chat-page-bg)] p-2 sm:p-3 md:h-screen md:p-4">
      <div className="h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-1.5rem)] md:h-full">
        <div className="h-full rounded-3xl border border-[var(--chat-border)] bg-[var(--chat-surface)] shadow-[0_20px_45px_-28px_rgba(35,35,35,0.3)]">
          <div className="flex h-full flex-col md:hidden">
            <div className="border-b border-[var(--chat-border)] p-2">
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--chat-composer-bg)] p-1">
                {(["chat", "code", "video"] as MobileView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveMobileView(view)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      activeMobileView === view
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 p-2">
              {activeMobileView === "chat" ? renderChatPanel() : null}
              {activeMobileView === "code" ? renderCodePanel(true) : null}
              {activeMobileView === "video" ? renderVideoPanel(true) : null}
            </div>
          </div>

          <div className="hidden h-full md:block">
            <ResizablePanelGroup orientation="horizontal" className="h-full">
              <ResizablePanel className="h-full w-full md:min-w-[320px]">
                {renderChatPanel()}
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel>
                <ResizablePanelGroup orientation="vertical">
                  <ResizablePanel className="m-4">
                    {renderCodePanel(false)}
                  </ResizablePanel>

                  <ResizableHandle />

                  <ResizablePanel className="m-4">
                    {renderVideoPanel(false)}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
