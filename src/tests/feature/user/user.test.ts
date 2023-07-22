import { faker } from '@faker-js/faker';
import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import request, { SuperAgentStatic } from 'superagent';
import { signUp } from '../../../controllers/User.controllers';
import User from '../../../database/User/User.interface';
import { createProject } from '../../../controllers/Project.controllers';

describe('user', () => {
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

  describe('valid request', () => {
    test('one user id', async () => {
      const p = agent.get(`${basePath}/users`).query({
        userIds: user._id.toString(),
      });

      await expect(p).resolves.toHaveProperty('body.users');

      await expect(p).resolves.toMatchObject({
        status: 200,
        body: {
          users: expect.arrayContaining([
            expect.objectContaining({
              _id: user._id.toString(),
            }),
          ]),
        },
      });
    });

    // TODO won't work for now
    test.skip('multiple user ids', async () => {
      const anotherUser = await signUp(faker.internet.userName(), 'password', 'cool@email.com');
      expect(anotherUser).not.toBeNull();

      const project = await createProject(user._id.toString(), 'test project', '');
      expect(project.type).toBe('success');

      const p = agent.get(`${basePath}/users`).query({
        userIds: user._id.toString(),
      });
    });
  });

  describe('invalid request', () => {
    test('missing auth', async () => {
      const p = request
        .get(`${basePath}/users`)
        .ok(() => true)
        .query({
          userIds: user._id.toString(),
        });

      await expect(p).resolves.toHaveProperty('status', 401);
      await expect(p).resolves.toHaveProperty('body.error.message', 'Missing authentication token');
    });

    test('missing userIds', async () => {
      const p = agent.get(`${basePath}/users`);

      await expect(p).resolves.toHaveProperty('status', 400);
      await expect(p).resolves.toHaveProperty('body.error.message', '\'userIds\' must be present');
    });

    test('invalid userIds', async () => {
      const p = agent
        .get(`${basePath}/users`)
        .ok(() => true)
        .query({
          userIds: [123, user._id.toString()],
        });

      await expect(p).resolves.toHaveProperty('status', 404);
      await expect(p).resolves.toHaveProperty('body.error.message', expect.stringContaining('123'));
      await expect(p).resolves.not.toHaveProperty(
        'body.error.message',
        expect.stringContaining(user._id.toString()),
      );
    });
  });
});
