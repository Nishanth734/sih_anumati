import { RetrievedChunk } from "./retrievalEngine";
import { ICitation } from "@/models/ChatHistory";

export interface RagResponse {
  answer: string;
  citations: ICitation[];
  usedFallback: boolean;
  modelUsed: string;
  error?: string;
}

export const GROQ_MODEL_NAME = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = (sector: string) => `You are ANUMATI AI - Official Statutory Compliance AI Assistant for government industrial approvals in India.
Your task is to answer the entrepreneur's question strictly using ONLY the provided statutory context chunks for the target sector: ${sector}.

CRITICAL INSTRUCTIONS:
1. Base your answer ONLY on the provided context chunks. Do NOT introduce external information or make assumptions.
2. If the provided context chunks do NOT contain enough information to answer the user's query, state clearly: "The provided statutory guidelines do not contain information regarding this specific query."
3. You MUST cite the source rule(s) (e.g., [Indian Boilers Act 1923, Section 6 & 7]) corresponding to each fact mentioned in your answer.
4. Keep your answer clear, structured, and professional for industrial entrepreneurs.`;

/**
 * Synthesizes a deterministic RAG response directly from context chunks when Groq API is unconfigured or fails
 */
function generateFallbackRagAnswer(
  userQuery: string,
  sector: string,
  chunks: RetrievedChunk[],
  errorMessage?: string
): RagResponse {
  const topChunks = chunks.filter((c) => c.score > 0);

  if (topChunks.length === 0) {
    return {
      answer: `The provided statutory guidelines for the ${sector} sector do not contain information regarding your query: "${userQuery}". Please consult statutory compliance officers or refine your search query.`,
      citations: [],
      usedFallback: true,
      modelUsed: "internal-statutory-compliance-engine",
      error: errorMessage,
    };
  }

  const citations: ICitation[] = topChunks.map((c) => ({
    chunkId: c.chunkId,
    title: c.title,
    sourceRule: c.sourceRule,
  }));

  const mainChunk = topChunks[0];
  const secondaryChunk = topChunks.length > 1 ? topChunks[1] : null;

  let answerText = `Based on statutory regulations for the **${sector}** sector under [${mainChunk.sourceRule}]:\n\n`;
  answerText += `${mainChunk.content}\n\n`;

  if (secondaryChunk) {
    answerText += `Additionally, under [${secondaryChunk.sourceRule}] (${secondaryChunk.title}):\n${secondaryChunk.content}`;
  }

  return {
    answer: answerText,
    citations,
    usedFallback: true,
    modelUsed: "internal-statutory-compliance-engine",
    error: errorMessage,
  };
}

/**
 * Executes RAG query using Groq API (or deterministic statutory fallback if GROQ_API_KEY is unconfigured/fails)
 */
export async function generateRagAnswer(
  userQuery: string,
  sector: string,
  chunks: RetrievedChunk[]
): Promise<RagResponse> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  const citations: ICitation[] = chunks.map((c) => ({
    chunkId: c.chunkId,
    title: c.title,
    sourceRule: c.sourceRule,
  }));

  // If no relevant chunks found
  const maxScore = chunks.length > 0 ? Math.max(...chunks.map((c) => c.score)) : 0;
  if (maxScore === 0) {
    return {
      answer: `The provided statutory guidelines for the ${sector} sector do not contain information regarding your query: "${userQuery}".`,
      citations: [],
      usedFallback: false,
      modelUsed: GROQ_MODEL_NAME,
    };
  }

  // Format context chunks for Groq prompt
  const contextString = chunks
    .map(
      (c, idx) =>
        `[Context Chunk ${idx + 1}]\nChunk ID: ${c.chunkId}\nSource Rule: ${c.sourceRule}\nTitle: ${c.title}\nCategory: ${c.category}\nContent: ${c.content}`
    )
    .join("\n\n");

  const promptMessage = `STATUTORY CONTEXT CHUNKS:\n${contextString}\n\nUSER QUESTION: ${userQuery}`;

  if (!apiKey) {
    console.log(`[Groq RAG Service] GROQ_API_KEY is blank in environment. Utilizing internal statutory engine (Fallback model).`);
    return generateFallbackRagAnswer(
      userQuery,
      sector,
      chunks,
      "GROQ_API_KEY is unconfigured in environment. Served via internal compliance engine."
    );
  }

  try {
    const targetModel = process.env.GROQ_MODEL?.trim() || GROQ_MODEL_NAME;
    console.log(`[Groq RAG Service] Invoking Groq LLM model: ${targetModel} for query: "${userQuery}"`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout guard

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT(sector) },
          { role: "user", content: promptMessage },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Groq API Error (${response.status})`;

      if (response.status === 401) {
        errorMsg = "Groq API Authentication Failed: Invalid GROQ_API_KEY provided.";
      } else if (response.status === 429) {
        errorMsg = "Groq API Rate Limit Exceeded: Please wait before sending more queries.";
      }

      console.error(`[Groq API Error ${response.status}]:`, errText);
      return generateFallbackRagAnswer(userQuery, sector, chunks, `${errorMsg}. Served via internal compliance engine.`);
    }

    const data = await response.json();
    const assistantText =
      data.choices && data.choices[0]?.message?.content
        ? data.choices[0].message.content
        : "The provided statutory guidelines do not contain information regarding this specific query.";

    const returnedModel = data.model || GROQ_MODEL_NAME;
    console.log(`[Groq RAG Service] Successfully received completion from Groq model: ${returnedModel}`);

    return {
      answer: assistantText,
      citations,
      usedFallback: false,
      modelUsed: returnedModel,
    };
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorDetail = isTimeout
      ? "Groq API request timed out (12s)."
      : `Groq API request failed: ${err.message}`;

    console.error("[Groq RAG Service Error]:", errorDetail);
    return generateFallbackRagAnswer(userQuery, sector, chunks, `${errorDetail} Served via internal statutory engine.`);
  }
}
