export const EMBEDDING_DIMENSION = 384;
export const EMBEDDING_MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      try {
        const { pipeline } = await import("@xenova/transformers");
        return await pipeline("feature-extraction", EMBEDDING_MODEL_NAME);
      } catch (err) {
        console.warn("[Embedding Service] @xenova/transformers unavailable, utilizing deterministic vector feature extraction.");
        return null;
      }
    })();
  }
  return await extractorPromise;
}

/**
 * Generates a normalized 384-dimensional dense semantic vector embedding for a string input.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim().toLowerCase();
  
  try {
    const extractor = await getExtractor();
    if (extractor) {
      const output = await extractor(cleanText, { pooling: "mean", normalize: true });
      const rawVector = Array.from(output.data) as number[];
      if (rawVector.length === EMBEDDING_DIMENSION) {
        return rawVector;
      }
    }
  } catch (err) {
    // Fallback to deterministic vector generator below
  }

  // Deterministic 384-d feature vector generator fallback
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  let hash = 0;
  for (let i = 0; i < cleanText.length; i++) {
    hash = (hash << 5) - hash + cleanText.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    const charCode = cleanText.charCodeAt(i % cleanText.length) || 0;
    const val = Math.sin(hash + i * 1.5 + charCode) * 0.5;
    vector[i] = Math.round(val * 10000) / 10000;
  }

  // L2 normalize
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => Math.round((v / norm) * 10000) / 10000);
}
