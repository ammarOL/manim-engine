"use client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [videoURL, setVideoURL] = useState("");

  async function handleSubmit() {
    setVideoURL("");
    const response = await axios.post("/api/generate", { prompt: prompt });

    let code = response.data.message
      .replace(/```python/g, "")
      .replace(/```/g, "")
      .trim();

    setResponse(code);
    setVideoURL("/videos/scene/480p15/Output.mp4");
  }

  return (
    <div className="h-screen">
      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel className="h-full w-full">
          <div className="flex flex-col">
            <div className="max-h-[80%] h-[80%] w-full flex-1">Here.</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="max-h-[20%] h-[20%] w-full"
            >
              <input
                type="text"
                placeholder="This is where your prompt goes!"
                className="border py-2 px-2"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                }}
              />
              <button>Submit Message</button>
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
