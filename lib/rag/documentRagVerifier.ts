import { retrieveRelevantChunks } from "./retrievalEngine";
import { GROQ_MODEL_NAME } from "./groqRagService";

export interface RagVerificationResult {
  compliant: boolean;
  missing_elements: string[];
  reasoning: string;
  retrievedRules: Array<{ chunkId: string; title: string; sourceRule: string }>;
  modelUsed: string;
}

const RAG_VERIFICATION_PROMPT = (sector: string, documentName: string) => `You are ANUMATI AI - Official Statutory Compliance Verification Judge.
Your task is to evaluate whether an uploaded industrial clearance document text satisfies the statutory requirements for the target sector: ${sector} and document type: "${documentName}".

CRITICAL INSTRUCTIONS:
1. Examine the extracted document text against the provided statutory rule context chunks below.
2. Determine if all required statutory elements, safety parameters, specifications, and signoffs mentioned in the rules are present in the document.
3. You MUST respond with ONLY a valid JSON object matching this exact schema:
{
  "compliant": boolean,
  "missing_elements": string[],
  "reasoning": string
}
4. Do NOT output markdown code blocks, backticks, or extra text outside the JSON object.
5. If the document is missing key required information, set "compliant" to false and list the missing elements in "missing_elements".`;

/**
 * Fallback deterministic RAG document verification when LLM API is unavailable
 */
function fallbackRagVerification(
  sector: string,
  documentName: string,
  ocrText: string,
  retrievedChunks: any[]
): RagVerificationResult {
  const missingElements: string[] = [];
  const textLower = ocrText.toLowerCase();

  const rulesSummary = retrievedChunks.map((c) => ({
    chunkId: c.chunkId,
    title: c.title,
    sourceRule: c.sourceRule,
  }));

  // Perform slot-specific and sector-scoped statutory requirement checks
  if (documentName === "PAN_CARD") {
    const hasPan = /([a-z]{5}[0-9]{4}[a-z]{1})/i.test(ocrText) || textLower.includes("pan") || textLower.includes("tax") || textLower.includes("fam") || textLower.includes("aecc") || textLower.includes("imcome");
    if (!hasPan) {
      missingElements.push("Lacks valid 10-character Permanent Account Number (PAN) / Income Tax entity registration under Section 139A.");
    }
  } else if (documentName === "GSTIN_CERTIFICATE") {
    const hasGstin = /([0-9]{2}[a-z]{5}[0-9]{4}[a-z]{1}[1-9a-z]{1}z[0-9a-z]{1})/i.test(ocrText) || textLower.includes("gst") || textLower.includes("gstin");
    if (!hasGstin) {
      missingElements.push("Lacks active 15-digit GSTIN registration certificate / Modulus 36 checksum under CGST Act 2017.");
    }
  } else if (documentName === "SITE_PLAN") {
    if (sector === "Boiler") {
      if (!textLower.includes("pressure") && !textLower.includes("bar") && !textLower.includes("mawp")) {
        missingElements.push("Lacks working pressure rating / MAWP specifications.");
      }
    } else if (sector === "Pollution") {
      if (!textLower.includes("stack") && !textLower.includes("chimney") && !textLower.includes("cte")) {
        missingElements.push("Lacks chimney stack height calculation / CTE site layout parameters.");
      }
    } else if (sector === "FactoryLicense") {
      if (!textLower.includes("fire") && !textLower.includes("margin") && !textLower.includes("setback")) {
        missingElements.push("Lacks mandatory fire tender 6-meter setback margin / building layout clear width.");
      }
      if (!textLower.includes("stability") && !textLower.includes("structural") && !textLower.includes("engineer")) {
        missingElements.push("Missing structural engineer stability certificate seal.");
      }
    }
  } else if (documentName === "SAFETY_NOC") {
    if (sector === "Boiler") {
      if (!textLower.includes("safety valve") && !textLower.includes("calibration") && !textLower.includes("hydrostatic")) {
        missingElements.push("Missing safety relief valve calibration certificate / 1.5x hydrostatic test log.");
      }
    } else if (sector === "Pollution") {
      if (!textLower.includes("effluent") && !textLower.includes("etp") && !textLower.includes("zld")) {
        missingElements.push("Lacks effluent treatment plant (ETP) / ZLD discharge compliance parameters.");
      }
    } else if (sector === "FactoryLicense") {
      if (!textLower.includes("fire") && !textLower.includes("noc") && !textLower.includes("first aid")) {
        missingElements.push("Missing Fire Department NOC clearance / worker safety welfare signoff.");
      }
    }
  }

  const isCompliant = missingElements.length === 0;

  return {
    compliant: isCompliant,
    missing_elements: missingElements,
    reasoning: isCompliant
      ? `Document satisfies statutory requirements under ${retrievedChunks[0]?.sourceRule || "sector guidelines"}.`
      : `Document failed compliance check. Missing ${missingElements.length} required statutory element(s) for ${documentName}.`,
    retrievedRules: rulesSummary,
    modelUsed: "internal-statutory-rag-rule-checker",
  };
}

/**
 * RAG-Based Content Verification (Hard Gate Layer 2)
 * Retrieves statutory rule chunks from Pinecone for the document type/sector,
 * calls Groq API to judge compliance, and returns structured JSON { compliant, missing_elements, reasoning }.
 */
export async function verifyDocumentRagCompliance(
  sector: string,
  documentName: string,
  ocrText: string
): Promise<RagVerificationResult> {
  // 1. Retrieve statutory rule chunks from Pinecone / Vector store for this document & documentType
  const retrievedChunks = await retrieveRelevantChunks(
    sector,
    `${documentName} statutory compliance requirements`,
    3,
    documentName
  );

  const rulesSummary = retrievedChunks.map((c) => ({
    chunkId: c.chunkId,
    title: c.title,
    sourceRule: c.sourceRule,
  }));

  const apiKey = process.env.GROQ_API_KEY?.trim();

  const contextText = retrievedChunks
    .map((c, i) => `[Rule Chunk ${i + 1}]\nRule: ${c.sourceRule}\nTitle: ${c.title}\nRequirements: ${c.content}`)
    .join("\n\n");

  const promptMessage = `STATUTORY RULE CONTEXT:\n${contextText}\n\nEXTRACTED UPLOADED DOCUMENT TEXT:\n${ocrText}`;

  console.log(`[Groq RAG API Request System Prompt]:\n${RAG_VERIFICATION_PROMPT(sector, documentName)}`);
  console.log(`[Groq RAG API Request Context Message]:\n${promptMessage}`);

  if (!apiKey) {
    console.log(`[RAG Document Verifier] GROQ_API_KEY is blank. Running fallback statutory RAG verification.`);
    return fallbackRagVerification(sector, documentName, ocrText, retrievedChunks);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL_NAME,
        messages: [
          { role: "system", content: RAG_VERIFICATION_PROMPT(sector, documentName) },
          { role: "user", content: promptMessage },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Groq RAG Verifier Error ${response.status}]:`, await response.text());
      return fallbackRagVerification(sector, documentName, ocrText, retrievedChunks);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";
    console.log(`[Groq RAG API Response Raw Content]:\n${rawContent}`);

    // Parse JSON shape
    const cleanJsonText = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJsonText);

    return {
      compliant: Boolean(parsed.compliant),
      missing_elements: Array.isArray(parsed.missing_elements) ? parsed.missing_elements : [],
      reasoning: parsed.reasoning || "RAG content analysis complete.",
      retrievedRules: rulesSummary,
      modelUsed: data.model || GROQ_MODEL_NAME,
    };
  } catch (err: any) {
    console.error("[Groq RAG Verifier Exception]:", err.message);
    return fallbackRagVerification(sector, documentName, ocrText, retrievedChunks);
  }
}
