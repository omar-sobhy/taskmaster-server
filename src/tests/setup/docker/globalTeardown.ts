import mongoose from 'mongoose';

export default async function globalTeardown() {
  // await globalThis.MONGO.stop();
  globalThis.TASKMASTER_SERVER.closeAllConnections();
  globalThis.TASKMASTER_SERVER.close();
  await mongoose.disconnect();
}
