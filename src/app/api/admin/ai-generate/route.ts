import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini API key missing" }, { status: 500 });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ error: "Failed to generate text" }, { status: 500 });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: "No text generated" }, { status: 500 });
    }

    return NextResponse.json({ text: generatedText.trim() });
  } catch (err: any) {
    console.error("AI Route Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}