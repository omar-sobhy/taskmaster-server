import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';

/* eslint-disable vars-on-top, no-var, @typescript-eslint/naming-convention */
declare global {
  var TASKMASTER_SERVER: Server;
  var TASKMASTER_PORT: number;
  var MONGO: MongoMemoryServer;
  var MONGO_URI: string;
}

export {};
