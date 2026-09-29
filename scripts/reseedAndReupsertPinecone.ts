import fs from "fs";
import path from "path";
import connectToDatabase from "../lib/db";
import SectorKnowledge from "../models/SectorKnowledge";
import { DEFAULT_KNOWLEDGE_CHUNKS } from "../lib/rag/seedKnowledge";
import { generateEmbedding } from "../lib/rag/embeddingService";
import { Pinecone } from "@pinecone-database/pinecone";

// Load env from .env.local
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
} catch (e) {}

async function reseedAndReupsert() {
  console.log("==========================================================================");
  console.log("    RE-SEEDING MONGODB & RE-UPSERTING ALL PINECONE VECTOR CHUNKS           ");
  console.log("==========================================================================\n");

  // 1. Reseed MongoDB
  await connectToDatabase();
  console.log("1. Reseeding MongoDB SectorKnowledge collection...");
  await SectorKnowledge.deleteMany({});
  const insertedDocs = await SectorKnowledge.insertMany(DEFAULT_KNOWLEDGE_CHUNKS);
  console.log(`✅ Successfully re-seeded ${insertedDocs.length} MongoDB knowledge chunks.`);

  // Verify all MongoDB docs have documentType
  const docsWithoutDocType = await SectorKnowledge.find({ documentType: { $exists: false } });
  console.log(`MongoDB chunks missing documentType: ${docsWithoutDocType.length}`);

  // 2. Re-upsert Pinecone Index
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX_NAME?.trim() || "anumati-statutory-rag";

  if (!apiKey) {
    console.log("⚠️ PINECONE_API_KEY is blank. Skipping Pinecone cloud index re-upsert.");
  } else {
    console.log(`\n2. Initializing Pinecone client with index: "${indexName}"...`);
    const pinecone = new Pinecone({ apiKey });
    const index = pinecone.index(indexName);

    console.log(`Embedding and upserting ${DEFAULT_KNOWLEDGE_CHUNKS.length} chunks to Pinecone...`);
    const records: any[] = [];
    for (const chunk of DEFAULT_KNOWLEDGE_CHUNKS) {
      const textToEmbed = `${chunk.title}. ${chunk.sourceRule}. ${chunk.category}. ${chunk.content}`;
      const vector = await generateEmbedding(textToEmbed);
      
      console.log(` Generated vector for chunk ID [${chunk.chunkId}] | docType: "${chunk.documentType}" | dim: ${vector.length}`);

      records.push({
        id: chunk.chunkId,
        values: vector,
        metadata: {
          chunkId: chunk.chunkId,
          sector: chunk.sector,
          documentType: chunk.documentType,
          title: chunk.title,
          category: chunk.category,
          sourceRule: chunk.sourceRule,
          content: chunk.content,
        },
      });
    }

    console.log(`Total records prepared: ${records.length}`);
    if (records.length > 0) {
      try {
        await index.upsert(records);
      } catch (err) {
        await (index as any).upsert({ records });
      }
      console.log(`✅ Successfully upserted ${records.length} vectors to Pinecone index "${indexName}".`);
    } else {
      console.warn("⚠️ No records to upsert.");
    }

    // 3. Query Pinecone directly to test metadata filter
    console.log("\n3. Testing Direct Pinecone Query with strict filter (sector: Boiler, documentType: PAN_CARD)...");
    const queryVector = await generateEmbedding("PAN_CARD statutory tax compliance requirements");
    const queryRes = await index.query({
      vector: queryVector,
      topK: 5,
      filter: {
        sector: { $eq: "Boiler" },
        documentType: { $eq: "PAN_CARD" },
      },
      includeMetadata: true,
    });

    console.log("\n--- RAW PINECONE DIRECT RETRIEVAL MATCHES ---");
    queryRes.matches?.forEach((match, i) => {
      const meta = match.metadata as any;
      console.log(`  [Match ${i + 1}] ID: ${match.id} | Score: ${(match.score || 0).toFixed(4)} | documentType: "${meta.documentType}" | Title: "${meta.title}"`);
    });
  }

  console.log("\n==========================================================================");
}

reseedAndReupsert().catch(console.error);
