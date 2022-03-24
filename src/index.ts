import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import fs from 'fs';
import https from 'https';
import yargs from 'yargs';

import initDb from './database';
import errorMiddleware from './middleware/error.middleware';
import loggerMiddleware from './middleware/logger.middleware';
import UserRoutes from './routes/User.routes';
import ProjectRoutes from './routes/Project.routes';
import SectionRoutes from './routes/Section.routes';
import TaskRoutes from './routes/Task.routes';
import CommentRoutes from './routes/Comment.routes';

const routes = [new UserRoutes(),
  new ProjectRoutes(),
  new SectionRoutes(),
  new TaskRoutes(),
  new CommentRoutes(),
];

async function start() {
  const argv = yargs(process.argv.slice(2)).options({
    mode: { type: 'string', default: 'dev' },
  }).parseSync();

  if (argv.mode.toLowerCase() === 'dev') {
    console.log('Loading dev environment...');
    dotenv.config({ path: '.env.dev' });
  } else {
    console.log('Loading prod environment...');
    dotenv.config();
  }

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cookieParser());
  app.use(cors({
    origin: [
      'http://localhost:8080',
      'https://omarsobhy.dev:8000',
    ],
    allowedHeaders: ['Authorization', 'Content-Type', 'Set-Cookie'],
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  }));

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.use(loggerMiddleware);

  routes.forEach((r) => {
    app.use(r.router);
  });

  app.use(errorMiddleware);

  try {
    await connectToDb();
    console.log('Connected to db successfully');

    const port = 3000;

    app.listen(port, () => {
      console.log(`Listening (http) at port ${port}`);
    });

    if (process.env.USE_HTTPS?.toLowerCase().trim() === 'true') {
      if (!process.env.CERT_PATH) {
        console.log('Cert path not found in environment variables');
        throw new Error();
      }

      if (!process.env.KEY_PATH) {
        console.log('Key path not found in environment variables');
        throw new Error();
      }

      try {
        const cert = fs.readFileSync(process.env.CERT_PATH, { encoding: 'utf-8' });
        const key = fs.readFileSync(process.env.KEY_PATH, { encoding: 'utf-8' });

        https.createServer({ cert, key }, app).listen(port + 1, () => {
          console.log(`Listening (https) at port ${port + 1}`);
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  } catch (error) {
    console.error('An error was thrown while starting. Exiting...');
  }
}

async function connectToDb() {
  try {
    await initDb();
  } catch (error) {
    console.error('Error thrown while connecting to db');
    console.error(error);
    throw error;
  }
}

start();
