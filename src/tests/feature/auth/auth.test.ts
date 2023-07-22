import {
  beforeAll, describe, expect, test,
} from '@jest/globals';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import { signUp } from '../../../controllers/User.controllers';

describe('auth', () => {
  let agent: SuperAgentStatic;

  const useHttps = process.env.USE_HTTPS;
  const taskmasterPort = process.env.TASKMASTER_PORT;

  const basePath = `${useHttps ? 'https' : 'http'}://localhost:${taskmasterPort}/users`;

  beforeAll(() => {
    agent = request
      .agent()
      .type('application/json')
      .ok(() => true);
  });

  describe('signup', () => {
    test('valid signup request', async () => {
      const user = {
        username: faker.internet.userName(),
        password: 'validpassword',
        email: 'random@random.com',
      };

      const p = agent.post(`${basePath}/signup`).send(user);

      await expect(p).resolves.toHaveProperty('body.user.username', user.username);
      await expect(p).resolves.toHaveProperty('body.user.email', user.email);
    });

    describe('invalid signup request', () => {
      test('short username', async () => {
        const user = {
          username: 'a',
          password: 'validpassword',
          email: 'random@random.com',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*username must be longer than.*/),
            },
          },
        });
      });

      test('long username', async () => {
        const user = {
          username: 'a'.repeat(100),
          password: 'validpassword',
          email: 'random@random.com',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*username must be shorter than.*/),
            },
          },
        });
      });

      test('long password', async () => {
        const user = {
          username: faker.internet.userName(),
          password: 'a'.repeat(256),
          email: 'random@random.com',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*password must be shorter than.*/),
            },
          },
        });
      });

      test('long email', async () => {
        const user = {
          username: faker.internet.userName(),
          password: 'validpassword',
          email: `${'a'.repeat(500)}@random.com`,
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*email must be shorter than.*/),
            },
          },
        });
      });

      test('invalid email', async () => {
        const user = {
          username: faker.internet.userName(),
          password: 'validpassword',
          email: 'invalid email address',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*must be an email.*/),
            },
          },
        });
      });

      test('missing username', async () => {
        const user = {
          password: 'validpassword',
          email: 'random@random.com',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*username must be a string.*/),
            },
          },
        });
      });

      test('missing password', async () => {
        const user = {
          username: 'validusername',
          email: 'random@random.com',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*password must be a string.*/),
            },
          },
        });
      });

      test('missing username', async () => {
        const user = {
          username: 'validusername',
          password: 'validpassword',
        };

        const p = agent.post(`${basePath}/signup`).send(user);

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringMatching(/.*email must be a string.*/),
            },
          },
        });
      });

      test('username already in use', async () => {
        const username = faker.internet.userName();

        const user = await signUp(username, 'validpassword', 'random@random.com');

        expect(user).not.toBeNull();

        const p = agent.post(`${basePath}/signup`).send({
          username: username.toUpperCase(),
          password: 'validpassword',
          email: 'random@random.com',
        });

        await expect(p).resolves.toHaveProperty('status', 409);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          `A user with username '${username.toUpperCase()}' already exists`,
        );
      });
    });
  });

  describe('login', () => {
    test('valid user can login', async () => {
      const username = faker.internet.userName();
      const user = await signUp(username, 'validpassword', 'random@random.com');

      expect(user).not.toBeNull();

      const p = agent.post(`${basePath}/login`).send({
        username,
        password: 'validpassword',
      });

      await expect(p).resolves.not.toThrow();
    });

    describe('invalid login request', () => {
      test('invalid username cannot login', async () => {
        const p = agent.post(`${basePath}/login`).send({
          username: 'invalidusername',
          password: 'invalidpassword',
        });

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          'Invalid username or password',
        );
      });

      test('invalid password cannot login', async () => {
        const username = faker.internet.userName();
        const user = await signUp(username, 'validpassword', 'random@random.com');

        expect(user).not.toBeNull();

        const p = agent.post(`${basePath}/login`).send({
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          username,
          password: 'invalidpassword',
        });

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          'Invalid username or password',
        );
      });

      test('missing username cannot login', async () => {
        const p = agent.post(`${basePath}/login`).send({
          password: 'invalidpassword',
        });

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringContaining('username must be a string'),
            },
          },
        });
      });

      test('missing password cannot login', async () => {
        const p = agent.post(`${basePath}/login`).send({
          username: 'validusername',
        });

        await expect(p).resolves.toMatchObject({
          body: {
            error: {
              message: expect.stringContaining('password must be a string'),
            },
          },
        });
      });
    });
  });
});
