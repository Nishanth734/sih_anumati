import fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import { DEFAULT_KNOWLEDGE_CHUNKS } from "../lib/rag/seedKnowledge";
import { generateEmbedding, EMBEDDING_DIMENSION } from "../lib/rag/embeddingService";

// Load .env.local environment variables
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    for (const line of envConfig.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    }
  }
} catch (e) {
  // Ignore env parse errors
}

async function upsertToPinecone() {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX_NAME?.trim() || "anumati-statutory-rag";

  if (!apiKey) {
    console.error("❌ PINECONE_API_KEY is not configured in .env.local. Please set PINECONE_API_KEY first.");
    process.exit(1);
  }

  console.log(`🌲 Initializing Pinecone client with index: "${indexName}"...`);
  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index(indexName);

  console.log(`🧠 Embedding ${DEFAULT_KNOWLEDGE_CHUNKS.length} statutory knowledge chunks using 384-d semantic vectors...`);

  const records = [];
  for (const chunk of DEFAULT_KNOWLEDGE_CHUNKS) {
    const textToEmbed = `${chunk.title}. ${chunk.sourceRule}. ${chunk.category}. ${chunk.content}`;
    console.log(` Generating vector for [${chunk.chunkId}] ${chunk.title}...`);
    
    const vector = await generateEmbedding(textToEmbed);

    records.push({
      id: chunk.chunkId,
      values: vector,
      metadata: {
        chunkId: chunk.chunkId,
        sector: chunk.sector,
        documentType: (chunk as any).documentType || "OTHER",
        title: chunk.title,
        category: chunk.category,
        sourceRule: chunk.sourceRule,
        content: chunk.content,
      },
    });
  }

  try {
    await (index as any).upsert({ records });
  } catch {
    await (index as any).upsert(records);
  }

  console.log(`✅ Successfully upserted ${records.length} statutory knowledge vectors into Pinecone!`);
  console.log(`   Index Dimension: ${EMBEDDING_DIMENSION} | Metric: Cosine | Metadata Scoped: sector`);
}

upsertToPinecone().catch((err) => {
  console.error("❌ Pinecone vector upsert failed:", err.message);
  process.exit(1);
});
