const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:3001/rocketchat';
const NEW_NAME = process.env.ROCKETCAT_NAME || 'DB Engage Bot';

(async () => {
  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db();
  await db.collection('users').updateOne(
    { username: 'docubutler' },
    { $set: { name: NEW_NAME } }
  );
  console.log(`docubutler name set to "${NEW_NAME}"`);
  await client.close();
})();