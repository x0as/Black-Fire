import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const SOURCE_URI = process.env.OLD_MONGO_URI;
const TARGET_URI = process.env.MONGO_URI;

if (!SOURCE_URI) {
  console.error('Missing OLD_MONGO_URI in environment.');
  process.exit(1);
}

if (!TARGET_URI) {
  console.error('Missing MONGO_URI in environment.');
  process.exit(1);
}

const personaSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  mode: { type: String, enum: ['nice', 'flirty', 'baddie'], required: true },
  nickname: { type: String, required: true },
  gender: { type: String, required: false }
}, { strict: false });

const validModes = new Set(['nice', 'flirty', 'baddie']);

function sanitizePersona(doc) {
  if (!doc || typeof doc !== 'object') return null;
  if (!doc.userId || !doc.nickname || !validModes.has(doc.mode)) return null;

  return {
    userId: String(doc.userId).trim(),
    mode: doc.mode,
    nickname: String(doc.nickname).trim(),
    gender: doc.gender ? String(doc.gender).trim() : 'unspecified'
  };
}

async function run() {
  const sourceConn = await mongoose.createConnection(SOURCE_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000
  }).asPromise();

  const targetConn = await mongoose.createConnection(TARGET_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000
  }).asPromise();

  try {
    const SourcePersona = sourceConn.model('Persona', personaSchema, 'personas');
    const TargetPersona = targetConn.model('Persona', personaSchema, 'personas');

    const sourceDocs = await SourcePersona.find({}).lean();
    let copied = 0;
    let skipped = 0;

    for (const doc of sourceDocs) {
      const normalized = sanitizePersona(doc);
      if (!normalized) {
        skipped++;
        continue;
      }

      await TargetPersona.findOneAndUpdate(
        { userId: normalized.userId },
        normalized,
        { upsert: true }
      );
      copied++;
    }

    console.log(`Persona migration complete. Copied: ${copied}, Skipped: ${skipped}`);
  } finally {
    await sourceConn.close();
    await targetConn.close();
  }
}

run().catch((error) => {
  console.error('Persona migration failed:', error);
  process.exit(1);
});
