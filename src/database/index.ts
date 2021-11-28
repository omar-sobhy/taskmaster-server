import mongoose from 'mongoose';

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '27017';
  const databaseName = process.env.DB_NAME || 'taskmaster';

  return mongoose.connect(`mongodb://${host}:${port}/${databaseName}`);
}

export default initDb;
