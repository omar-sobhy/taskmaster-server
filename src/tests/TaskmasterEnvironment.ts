import NodeEnvironment from 'jest-environment-node';
import { Server } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { promisify } from 'util';
import start from '../server';

class TaskmasterEnvironment extends NodeEnvironment {
  private server?: Server;

  private mongod?: MongoMemoryServer;

  async setup() {
    const startResult = await start({ testing: true });
    if (!startResult) {
      throw new Error('Could not start server for testing. Exiting...');
    }

    this.server = startResult.httpServer;

    this.mongod = await MongoMemoryServer.create();

    const url = this.mongod.getUri();

    await mongoose.connect(url, {
      dbName: `taskmaster-${crypto.randomUUID()}`,
    });

    this.global.TASKMASTER_PORT = (this.server.address() as { port: number }).port;
  }

  async teardown() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await this.mongod?.stop();
    await promisify(this.server!.close.bind(this.server!))();
  }
}

export default TaskmasterEnvironment;
