import { env, isAiConfigured } from "../config/env.js";

const GEMINI_ENDPOINT = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Thin, provider-agnostic wrapper around the configured AI provider.
 * Today this targets the Gemini API (env.AI_PROVIDER=gemini), but every
 * caller in this codebase only depends on generateJSON/generateText, so
 * swapping providers means changing this file alone.
 *
 * IMPORTANT: this service NEVER decides pass/fail or invents candidate
 * facts. It only (a) explains scores that were already computed
 * deterministically in matchingService.js, (b) generates interview
 * questions/evaluations grounded in supplied evidence, and (c) drafts
 * text. All numeric scoring lives in matchingService.js.
 */

const MAX_RETRIES = 2;

async function callGemini(prompt, { json = false, temperature = 0.3 } = {}) {
  if (!isAiConfigured()) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const url = `${GEMINI_ENDPOINT(env.geminiModel)}?key=${env.geminiApiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        lastError = new Error("AI_RATE_LIMITED");
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`AI_REQUEST_FAILED: ${res.status} ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      if (!text) throw new Error("AI_EMPTY_RESPONSE");
      return text;
    } catch (err) {
      lastError = err;
      if (err.message === "AI_REQUEST_FAILED" || attempt === MAX_RETRIES) break;
    }
  }
  throw lastError || new Error("AI_REQUEST_FAILED");
}

/** Strips ```json fences some models add, then parses. Throws on invalid JSON. */
function parseJsonResponse(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("AI_INVALID_JSON_RESPONSE");
  }
}

export async function generateJSON(prompt, opts = {}) {
  const text = await callGemini(prompt, { ...opts, json: true });
  return parseJsonResponse(text);
}

export async function generateText(prompt, opts = {}) {
  return callGemini(prompt, { ...opts, json: false });
}

export { isAiConfigured };
