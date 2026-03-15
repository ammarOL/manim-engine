"use client";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  async function handleSubmit() {
    const response = await axios.post("/api/generate", { prompt: prompt });
    setResponse(response.data.message);
  }

  return (
    <div>
      hello world
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
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
      <div>{response}</div>
    </div>
  );
}
