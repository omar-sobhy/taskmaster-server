import {
  afterAll, beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import { ObjectId } from 'mongodb';
import request, { SuperAgentStatic } from 'superagent';
import mongoose from 'mongoose';
import ProjectModel from '../../../database/Project/Project.model';
import { signUp } from '../../../controllers/User.controllers';
import User from '../../../database/User/User.interface';
import { createProject } from '../../../controllers/Project.controllers';
import UserModel from '../../../database/User/User.model';

describe('project', () => {
  const useHttps = process.env.USE_HTTPS;
  const port = globalThis.TASKMASTER_PORT ?? 3000;

  const basePath = `${useHttps ? 'https' : 'http'}://localhost:${port}`;

  let agent: SuperAgentStatic;
  let user: User;

  beforeAll(async () => {
    console.log(`ready state ${mongoose.connection.readyState}`);
    const userResult = await signUp('username', 'password', 'cool@email.com');
    expect(userResult).not.toBe(null);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    user = userResult!;
  });

  beforeEach(async () => {
    await ProjectModel.deleteMany({});
    agent = request.agent();

    if (expect.getState().currentTestName !== 'missing auth') {
      await agent
        .post(`${basePath}/users/login`)
        .set('Content-Type', 'application/json')
        .send({ username: 'username', password: 'password' });
    }
  });

  describe.skip('get all projects', () => {
    test('missing auth', () => {});

    test('one project', async () => {
      const firstProject = await createProject(user._id.toString(), 'test');
      const secondProject = await createProject(new ObjectId(24).toString(), 'random name');

      expect(firstProject).not.toBeNull();

      const p = agent.get(`${basePath}/projects`);

      await p;

      await expect(p).resolves.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: firstProject?._id,
            }),
          ]),
        },
      });

      await expect(p).resolves.not.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: secondProject?._id,
            }),
          ]),
        },
      });
    });

    test.skip('many projects', async () => {});
  });

  test.skip('get project', async () => {
    const project = await createProject(user._id.toString(), 'test');

    return expect(project).not.toBeNull();

    // const loginResult = axios.post(`${basePath}/users/login`, {
    //   username: 'username',
    //   password: 'password',
    // });

    // await expect(loginResult).resolves.not.toThrow();

    // const projectResult = axios.get(`${basePath}/projects`);
  });

  describe('invalid request', () => {
    test('missing auth', () => {});

    test('missing permission to see project', () => {});

    test('invalid project id', () => {});
  });
});
