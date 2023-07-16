import mongoose from 'mongoose';
import start from '../../../server';

export default async function globalSetup() {
  // globalThis.MONGO = await MongoMemoryServer.create({
  //   instance: {
  //     ip: '::,0.0.0.0',
  //     port: Number(process.env.DB_PORT),
  //     dbName: 'taskmaster',
  //   },
  // });

  // await globalThis.MONGO.ensureInstance();

  const startResult = await start({ testing: true, log: false });
  if (!startResult) {
    throw new Error('Could not start server for testing. Exiting...');
  }

  globalThis.TASKMASTER_SERVER = startResult.httpServer;

  mongoose.set('strictQuery', false);
  await mongoose.connect('mongodb://mongodb:27017/taskmaster', {
    connectTimeoutMS: 1000,
  });
}
