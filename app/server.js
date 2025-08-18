import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 8000;
const mongoUrl = process.env.MONGO_URL; // e.g., mongodb://db:27017/app

let db = null;
let items = []; // fallback in-memory store

app.use(express.json());
app.use(express.static('app/public'));

async function initDb() {
  if (!mongoUrl) {
    console.log('MONGO_URL not set. Using in-memory store.');
    return;
  }
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(); // default DB from URI
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed, falling back to memory:', err.message);
    db = null;
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true, db: !!db, time: new Date().toISOString() });
});

app.get('/api/items', async (req, res) => {
  if (db) {
    const list = await db.collection('items').find({}).toArray();
    res.json(list);
  } else {
    res.json(items);
  }
});

app.post('/api/items', async (req, res) => {
  const item = { id: Date.now(), text: (req.body?.text || '').toString() };
  if (db) {
    await db.collection('items').insertOne(item);
  } else {
    items.push(item);
  }
  res.status(201).json(item);
});

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

initDb().then(() => {
  app.listen(port, () => console.log(`WebApp listening on http://localhost:${port}`));
});
