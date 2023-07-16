import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import https from 'https';
import yargs from 'yargs';
import { pino } from 'pino';
import pinoHttp from 'pino-http';

import { initDb } from './database';
import errorMiddleware from './middleware/error.middleware';
import UserRoutes from './routes/User.routes';
import ProjectRoutes from './routes/Project.routes';
import SectionRoutes from './routes/Section.routes';
import TaskRoutes from './routes/Task.routes';
import CommentRoutes from './routes/Comment.routes';
import TagRoutes from './routes/Tag.routes';

interface Options {
  testing?: boolean;
  log?: boolean;
}

// eslint-disable-next-line consistent-return
async function start(options?: Options) {
  const log = options?.log ?? true;

  const argv = yargs(process.argv.slice(2))
    .options({
      mode: { type: 'string', default: 'dev' },
    })
    .parseSync();

  const logger = pino({
    enabled: log,
  });

  if (options?.testing) {
    logger.info('Loading test environment...');
    dotenv.config({ path: '.env.test' });
  } else if (argv.mode.toLowerCase() === 'dev') {
    logger.info('Loading dev environment...');
    dotenv.config({ path: '.env.dev' });
  } else {
    logger.info('Loading prod environment...');
    dotenv.config();
  }

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: [
        'http://localhost:8080',
        'http://localhost:5173',
        'https://taskmaster.omarsobhy.dev',
        'https://taskmaster.svitkona.xyz',
      ],
      allowedHeaders: ['Authorization', 'Content-Type', 'Set-Cookie'],
      credentials: true,
      exposedHeaders: ['Set-Cookie'],
    }),
  );

  if (log) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    app.use(pinoHttp());
  }

  const routes = [
    new UserRoutes(),
    new ProjectRoutes(logger),
    new SectionRoutes(),
    new TaskRoutes(),
    new CommentRoutes(),
    new TagRoutes(),
  ];

  routes.forEach((r) => {
    app.use(r.router);
  });

  app.use(errorMiddleware);

  try {
    if (!options?.testing) {
      await connectToDb();
      logger.info('Connected to db successfully');
    }

    const port = Number(process.env.TASKMASTER_PORT) ?? 3000;

    const httpServer = app.listen(port, () => {
      const address = httpServer.address();
      if (typeof address !== 'string') {
        logger.info(`Listening (http) at port ${address?.port ?? 'unknown'}`);
      } else {
        logger.info(`Listening (http) at port ${port}`);
      }
    });

    if (process.env.USE_HTTPS?.toLowerCase().trim() === 'true') {
      if (!process.env.CERT_PATH) {
        logger.info('Cert path not found in environment variables');
        throw new Error();
      }

      if (!process.env.KEY_PATH) {
        logger.info('Key path not found in environment variables');
        throw new Error();
      }

      try {
        const cert = fs.readFileSync(process.env.CERT_PATH, {
          encoding: 'utf-8',
        });
        const key = fs.readFileSync(process.env.KEY_PATH, {
          encoding: 'utf-8',
        });

        https.createServer({ cert, key }, app).listen(port + 1, () => {
          logger.info(`Listening (https) at port ${port + 1}`);
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    }

    return {
      httpServer,
    };
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

export default start;
