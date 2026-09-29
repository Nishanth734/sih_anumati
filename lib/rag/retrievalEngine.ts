import connectToDatabase from "@/lib/db";
import SectorKnowledge from "@/models/SectorKnowledge";
import { seedSectorKnowledge } from "./seedKnowledge";
import { generateEmbedding } from "./embeddingService";
import { Pinecone } from "@pinecone-database/pinecone";

export interface RetrievedChunk {
  chunkId: string;
  title: string;
  category: string;
  sourceRule: string;
  content: string;
  score: number;
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "about", "above", "after", "again", "against",
  "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
  "before", "being", "below", "between", "both", "by", "can", "can't", "cannot", "could",
  "did", "do", "does", "doing", "don't", "down", "during", "each", "few", "for", "from",
  "further", "had", "has", "have", "having", "he", "her", "here", "him", "how", "i", "if",
  "in", "into", "is", "it", "its", "me", "more", "most", "my", "no", "nor", "not", "of",
  "off", "on", "once", "only", "or", "other", "our", "out", "over", "own", "same", "she",
  "should", "so", "some", "such", "than", "that", "the", "their", "them", "then", "there",
  "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
  "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
  "with", "would", "you", "your", "tell", "give", "details", "information", "need", "want"
]);

/**
 * Tokenizes text into unique lowercased stemmed words excluding common stopwords
 */
export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Calculates keyword overlap similarity score for a knowledge chunk against query tokens
 */
export function scoreChunk(chunk: any, queryTokens: string[], rawQuery: string): number {
  if (queryTokens.length === 0) return 0;

  const titleTokens = new Set(tokenizeText(chunk.title || ""));
  const categoryTokens = new Set(tokenizeText(chunk.category || ""));
  const sourceTokens = new Set(tokenizeText(chunk.sourceRule || ""));
  const contentTokens = tokenizeText(chunk.content || "");
  const contentTokenSet = new Set(contentTokens);

  let score = 0;
  const lowerQuery = rawQuery.toLowerCase();

  if (chunk.content?.toLowerCase().includes(lowerQuery)) score += 15;
  if (chunk.title?.toLowerCase().includes(lowerQuery)) score += 20;

  for (const kw of chunk.keywords || []) {
    if (lowerQuery.includes(kw.toLowerCase())) score += 10;
  }

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 6;
    if (categoryTokens.has(token)) score += 4;
    if (sourceTokens.has(token)) score += 8;
    if (contentTokenSet.has(token)) {
      const count = contentTokens.filter((t) => t === token).length;
      score += 2 + Math.min(count, 3);
    }
  }

  return score;
}

/**
 * Fallback keyword-based retrieval method
 */
async function retrieveRelevantChunksKeywordFallback(
  sector: string,
  query: string,
  topK = 3,
  documentType?: string
): Promise<RetrievedChunk[]> {
  await connectToDatabase();
  await seedSectorKnowledge();

  const queryFilter: any = { sector };
  if (documentType) {
    queryFilter.documentType = documentType;
  }

  const ModelObj: any = (SectorKnowledge as any).default || SectorKnowledge;
  let chunks = await ModelObj.find(queryFilter).lean();
  if (!chunks || chunks.length === 0) {
    // If no documentType-specific chunks exist, fall back to sector-wide chunks
    chunks = await ModelObj.find({ sector }).lean();
  }
  if (!chunks || chunks.length === 0) return [];

  const queryTokens = tokenizeText(query);
  const scored = chunks.map((chunk: any) => {
    const score = scoreChunk(chunk, queryTokens, query);
    return {
      chunkId: chunk.chunkId,
      title: chunk.title,
      category: chunk.category,
      sourceRule: chunk.sourceRule,
      content: chunk.content,
      score,
    };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Retrieves top-k sector-scoped statutory knowledge chunks.
 * Primary: Pinecone Vector Similarity Search (Metadata filtered by sector AND documentType)
 * Fallback: Keyword TF-IDF / Term Overlap Search
 */
export async function retrieveRelevantChunks(
  sector: string,
  query: string,
  topK = 3,
  documentType?: string
): Promise<RetrievedChunk[]> {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX_NAME?.trim() || "anumati-statutory-rag";
  const validSectors = ["Boiler", "Pollution", "FactoryLicense"];
  const targetSector = validSectors.includes(sector) ? sector : "Boiler";

  // 1. Attempt Pinecone Vector Search if API key is provided
  if (apiKey) {
    try {
      console.log(`[Pinecone Vector Search] Querying vector index "${indexName}" for sector: "${targetSector}", documentType: "${documentType || "ALL"}"`);
      const pinecone = new Pinecone({ apiKey });
      const index = pinecone.index(indexName);

      const queryVector = await generateEmbedding(query);

      const filter: any = { sector: { $eq: targetSector } };
      if (documentType) {
        filter.documentType = { $eq: documentType };
      }

      const queryResponse = await index.query({
        vector: queryVector,
        topK,
        filter,
        includeMetadata: true,
      });

      if (queryResponse?.matches && queryResponse.matches.length > 0) {
        const vectorResults: RetrievedChunk[] = queryResponse.matches
          .filter((match) => match.metadata && (match.score ?? 0) >= 0.1)
          .map((match) => {
            const meta = match.metadata as any;
            return {
              chunkId: meta.chunkId || match.id,
              title: meta.title || "Statutory Rule",
              category: meta.category || "Regulation",
              sourceRule: meta.sourceRule || "Government Act",
              content: meta.content || "",
              score: Math.round((match.score || 0) * 100),
            };
          });

        if (vectorResults.length > 0) {
          console.log(`[Pinecone Vector Search] Successfully retrieved ${vectorResults.length} semantic vector matches for documentType "${documentType}".`);
          return vectorResults;
        }
      }
    } catch (err: any) {
      console.warn(`[Pinecone Vector Search] Vector query fallback (${err.message}). Utilizing keyword engine.`);
    }
  }

  // 2. Keyword Fallback Search if Pinecone is unconfigured or unreachable
  return retrieveRelevantChunksKeywordFallback(targetSector, query, topK, documentType);
}
