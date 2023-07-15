import mongoose from 'mongoose';

async function createTestingDb() {
  const id = crypto.randomUUID();
  const newSchemaName = 'taskmaster';

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '27017';

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _mongoose = await mongoose.connect(`mongodb://${host}:${port}/${newSchemaName}`, {
    serverSelectionTimeoutMS: 1000,
    dbName: newSchemaName,
  });

  return {
    schemaName: newSchemaName,
    mongoose: _mongoose,
  };
}

async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '27017';
  const databaseName = process.env.DB_NAME || 'taskmaster';

  return mongoose.connect(`mongodb://${host}:${port}/${databaseName}`);
}

export default initDb;

export { initDb, createTestingDb };
