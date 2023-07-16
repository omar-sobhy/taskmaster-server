import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import { ObjectId } from 'mongodb';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import ProjectModel from '../../../database/Project/Project.model';
import { signUp } from '../../../controllers/User.controllers';
import User from '../../../database/User/User.interface';
import { createProject } from '../../../controllers/Project.controllers';

describe('project', () => {
  const useHttps = process.env.USE_HTTPS;
  const taskmasterPort = process.env.TASKMASTER_PORT;

  const basePath = `${useHttps ? 'https' : 'http'}://localhost:${taskmasterPort}`;

  let agent: SuperAgentStatic;
  let user: User;

  beforeAll(async () => {
    const username = faker.internet.userName();

    const userResult = await signUp(username, 'password', 'cool@email.com');

    expect(userResult).not.toBe(null);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    user = userResult!;
  });

  beforeEach(async () => {
    agent = request
      .agent()
      .type('application/json')
      .ok(() => true);

    if (expect.getState().currentTestName !== 'missing auth') {
      const res = await agent
        .post(`${basePath}/users/login`)
        .send({ username: user.username, password: 'password' });

      expect(res.ok).toBe(true);
    }
  });

  describe('get all projects', () => {
    test('one project', async () => {
      const firstProject = await createProject(user._id.toString(), 'test');
      const secondProject = await createProject(new ObjectId(24).toString(), 'random name');

      expect(firstProject).not.toBeNull();

      const p = agent.get(`${basePath}/projects`);

      await expect(p).resolves.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: firstProject?._id.toString(),
            }),
          ]),
        },
      });

      await expect(p).resolves.not.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: secondProject?._id.toString(),
            }),
          ]),
        },
      });
    });

    test('many projects', async () => {
      const firstProject = await createProject(user._id.toString(), 'test');
      const secondProject = await createProject(user._id.toString(), 'random name');

      expect(firstProject).not.toBeNull();
      expect(secondProject).not.toBeNull();

      const p = agent.get(`${basePath}/projects`);

      await expect(p).resolves.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: firstProject?._id.toString(),
            }),
            expect.objectContaining({
              _id: secondProject?._id.toString(),
            }),
          ]),
        },
      });
    });

    test('no projects', async () => {
      const username = faker.internet.userName();

      // create another user with no projects
      const anotherUser = await signUp(username, 'password', 'cool@email.com');

      expect(anotherUser).not.toBeNull();

      const anotherAgent = request
        .agent()
        .type('application/json')
        .ok(() => true);

      const loginResult = await anotherAgent
        .post(`${basePath}/users/login`)
        .send({ username, password: 'password' });

      expect(loginResult).toMatchObject({
        body: {
          user: {
            username,
          },
        },
      });

      const p = anotherAgent.get(`${basePath}/projects`);

      await expect(p).resolves.toMatchObject({
        body: {
          projects: [],
        },
      });
    });

    describe('invalid request', () => {
      test('missing auth', async () => {
        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/projects`);

        await expect(p).rejects.toMatchObject({
          response: {
            body: {
              error: {
                message: 'Missing authentication token',
              },
            },
          },
        });
      });
    });
  });

  describe('get project by id', () => {
    test('valid request', async () => {
      const project = await createProject(user._id.toString(), 'test');

      expect(project).not.toBeNull();

      const p = agent.get(`${basePath}/projects/${project!._id}`);

      await expect(p).resolves.toMatchObject({
        body: {
          project: {
            _id: project!._id.toString(),
          },
        },
      });
    });

    describe('invalid request', () => {
      test('missing auth', async () => {
        const project = await createProject(user._id.toString(), 'test');

        expect(project).not.toBeNull();

        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/projects/${project!._id}`);

        await expect(p).rejects.toMatchObject({
          response: {
            body: {
              error: {
                message: 'Missing authentication token',
              },
            },
          },
        });
      });

      test('missing permission to see project', async () => {
        const username = faker.internet.userName();

        const anotherUser = await signUp(username, 'password', 'cool@email.com');

        expect(anotherUser).not.toBeNull();

        const project = await createProject(anotherUser!._id.toString(), 'test');

        expect(project).not.toBeNull();

        // will use auth cookie for pre-created user

        const p = agent.get(`${basePath}/projects/${project!._id}`);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          `No project with id '${project!._id.toString()}' found`,
        );
      });

      test('invalid project id', async () => {
        const p = agent.get(`${basePath}/projects/invalidid`);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          'No project with id \'invalidid\' found',
        );
      });
    });
  });
});
