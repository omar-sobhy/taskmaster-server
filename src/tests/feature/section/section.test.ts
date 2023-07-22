import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import User from '../../../database/User/User.interface';
import { signUp } from '../../../controllers/User.controllers';
import Project from '../../../database/Project/Project.interface';
import { createProject, createSections } from '../../../controllers/Project.controllers';
import Section from '../../../database/Section/Section.interface';
import { Success } from '../../../interfaces/Result';
import { createTask } from '../../../controllers/Section.controllers';
import Task from '../../../database/Task/Task.interface';

describe('section', () => {
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
      const loginResult = await agent
        .post(`${basePath}/users/login`)
        .send({ username: user.username, password: 'password' });

      expect(loginResult.ok).toBe(true);
    }
  });

  describe('get section by id', () => {
    let project: Project;
    let section: Section;

    beforeAll(async () => {
      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;

      const sectionResult = await createSections(project._id.toString(), [
        { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
      ]);

      expect(sectionResult.type).toBe('success');

      [section] = (sectionResult as Success<Section[]>).data;
    });

    test.each([
      { tasks: [] },
      { tasks: [{ name: faker.word.noun() }] },
      { tasks: [{ name: faker.word.noun() }, { name: faker.word.noun() }] },
    ])('has tasks', async ({ tasks }) => {
      const promises = tasks.map(async (task) => {
        const taskResult = await createTask(section._id.toString(), task.name);

        await expect(taskResult).not.toBeNull();

        return taskResult;
      });

      const awaitedTasks = await Promise.all(promises);

      expect(awaitedTasks).not.toContainEqual({
        type: 'error',
      });

      const p = agent.get(`${basePath}/sections/${section._id}`);

      await expect(p).resolves.toHaveProperty('status', 200);
      await expect(p).resolves.toHaveProperty('body.section.tasks');

      const ids = (awaitedTasks as Success<Task>[]).map((t) => t.data._id.toString());

      expect(p).resolves.toHaveProperty('body.section.tasks', expect.arrayContaining(ids));
    });

    describe('invalid request', () => {
      test('missing auth', async () => {
        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/sections/randomid`);

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

      test('invalid section id', async () => {
        const p = agent.get(`${basePath}/sections/invalidid`);

        await expect(p).resolves.toHaveProperty('status', 404);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          'No section with id \'invalidid\' found',
        );
      });

      test.skip('missing permission to see section', async () => {});
    });
  });
});
