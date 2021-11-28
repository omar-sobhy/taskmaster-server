import 'reflect-metadata';

import express from 'express';

import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import initDb from './database';
import errorMiddleware from './middleware/error.middleware';
import loggerMiddleware from './middleware/logger.middleware';
import UserRoutes from './routes/User.routes';
import ProjectRoutes from './routes/Project.routes';
import SectionRoutes from './routes/Section.routes';

dotenv.config();

const routes = [new UserRoutes(), new ProjectRoutes(), new SectionRoutes()];

async function start() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cookieParser());

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
      console.log(`Listening at port ${port}`);
    });
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
