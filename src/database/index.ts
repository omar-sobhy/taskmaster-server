import mongoose from 'mongoose';

const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const databaseName = process.env.DB_NAME;

async function initDb() {
  mongoose.connect(`mongodb://${host}:${port}/${databaseName}`);
}

export {
  initDb, host, port, databaseName,
};
