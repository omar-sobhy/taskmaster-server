import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
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

  describe('update section', () => {
    let project: Project;
    let section: Section;

    beforeEach(async () => {
      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;

      const sectionResult = await createSections(project._id.toString(), [
        { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
      ]);

      expect(sectionResult.type).toBe('success');

      [section] = (sectionResult as Success<Section[]>).data;
    });

    describe('valid request', () => {
      test('change name', async () => {
        const name = faker.word.noun();

        const p = agent.patch(`${basePath}/sections/${section._id.toString()}`).send({
          name,
        });

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty(
          'body.section',
          expect.objectContaining({
            name,
            colour: section.colour,
            icon: section.icon,
          }),
        );
      });

      test('change colour', async () => {
        const colour = faker.color.rgb();

        const p = agent.patch(`${basePath}/sections/${section._id.toString()}`).send({
          colour,
        });

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty(
          'body.section',
          expect.objectContaining({
            name: section.name,
            colour,
            icon: section.icon,
          }),
        );
      });

      test.skip('change icon', async () => {
        const icon = faker.word.noun();

        const p = agent.patch(`${basePath}/sections/${section._id.toString()}`).send({
          icon,
        });

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty(
          'body.section',
          expect.objectContaining({
            name: section.name,
            colour: section.colour,
            icon,
          }),
        );
      });
    });

    describe('invalid request', () => {
      test('long section name', async () => {
        const p = agent.patch(`${basePath}/sections/${section._id.toString()}`).send({
          name: 'a'.repeat(256),
        });

        await expect(p).resolves.toHaveProperty('status', 400);

        await expect(p).resolves.toHaveProperty('body.error.propsErrors.0.property', 'name');
        await expect(p).resolves.toHaveProperty(
          'body.error.propsErrors.0.constraints.0',
          'maxLength',
        );
      });

      test('invalid colour string', async () => {
        const p = agent.patch(`${basePath}/sections/${section._id.toString()}`).send({
          colour: 'invalid rgb string',
        });

        await expect(p).resolves.toHaveProperty('status', 400);

        await expect(p).resolves.toHaveProperty('body.error.propsErrors.0.property', 'colour');

        await expect(p).resolves.toHaveProperty(
          'body.error.propsErrors.0.constraints.0',
          'isValidRgbString',
        );
      });

      test('missing auth', async () => {
        const p = request.patch(`${basePath}/sections/${section._id.toString()}`).send({
          section: {
            name: faker.word.noun(),
            colour: faker.color.rgb(),
            icon: faker.word.noun(),
          },
        });

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

  describe('create task', () => {
    let project: Project;
    let section: Section;

    beforeEach(async () => {
      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;

      const sectionResult = await createSections(project._id.toString(), [
        { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
      ]);

      expect(sectionResult.type).toBe('success');

      [section] = (sectionResult as Success<Section[]>).data;
    });

    describe('valid request', () => {
      test.each([
        {
          name: faker.word.noun(),
        },
        {
          name: faker.word.noun(),
          dueDate: format(faker.date.future(), 'yyyy-MM-dd'),
        },
      ])('good task data', async (task) => {
        const p = agent.post(`${basePath}/sections/${section._id.toString()}/tasks`).send(task);

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty('body.task.name', task.name);
      });

      test('valid assignee', async () => {
        const task = {
          name: faker.word.noun(),
          dueDate: format(faker.date.future(), 'yyyy-MM-dd'),
          assignee: user._id.toString(),
        };

        const p = agent.post(`${basePath}/sections/${section._id.toString()}/tasks`).send(task);

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty('body.task.name', task.name);
      });
    });

    describe('invalid request', () => {
      test('invalid section id', async () => {
        const p = agent.post(`${basePath}/sections/invalidid/tasks`).send({
          name: faker.word.noun(),
          dueDate: faker.date.future(),
          assignee: user._id.toString(),
        });

        await expect(p).resolves.toHaveProperty('status', 404);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          expect.stringContaining('invalidid'),
        );
      });

      test.each([
        {
          name: undefined,
          dueDate: faker.date.future(),
          errorPath: 'name',
        },
        {
          name: '',
          dueDate: faker.date.future(),
          errorPath: 'name',
        },
        {
          name: 'a'.repeat(256),
          dueDate: faker.date.future(),
          errorPath: 'name',
        },
        {
          name: faker.word.noun(),
          dueDate: 'invalid format',
          errorPath: 'dueDate',
        },
      ])('bad task data', async ({ name, dueDate, errorPath }) => {
        const sectionId = section._id.toString();

        const formattedDate = typeof dueDate === 'string' ? dueDate : format(dueDate, 'yyyy-MM-dd');

        const p = agent.post(`${basePath}/sections/${sectionId}/tasks`).send({
          name,
          dueDate: formattedDate,
          assignee: user._id.toString(),
        });

        await expect(p).resolves.toHaveProperty('status', 400);

        await expect(p).resolves.toHaveProperty('body.error.propsErrors.0.property', errorPath);
      });

      test('invalid assignee id', async () => {
        const p = agent.post(`${basePath}/sections/${section._id.toString()}/tasks`).send({
          name: faker.word.noun(),
          dueDate: format(faker.date.future(), 'yyyy-MM-dd'),
          assignee: 'invalidid',
        });

        await expect(p).resolves.toHaveProperty('status', 400);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          expect.stringContaining('invalidid'),
        );
      });

      test('missing auth', async () => {
        const p = request.post(`${basePath}/sections/${section._id.toString()}/tasks`).send({
          name: faker.word.noun(),
        });

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

  describe('get tasks', () => {
    let project: Project;
    let section: Section;

    beforeEach(async () => {
      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;

      const sectionResult = await createSections(project._id.toString(), [
        { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
      ]);

      expect(sectionResult.type).toBe('success');

      [section] = (sectionResult as Success<Section[]>).data;
    });

    describe('valid request', () => {
      test.each([0, 1, 2])('has tasks', async (n) => {
        const promises = [];
        for (let i = 0; i < n; ++i) {
          const taskResult = createTask(section._id.toString(), faker.word.noun());
          promises.push(taskResult);
        }

        const taskResults = await Promise.all(promises);

        taskResults.forEach((t) => {
          expect(t.type).toBe('success');
        });

        const p = agent.get(`${basePath}/sections/${section._id.toString()}/tasks`);

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty('body.tasks.length', n);
      });
    });

    describe('invalid request', () => {
      test('invalid section id', async () => {
        const p = agent.get(`${basePath}/sections/invalidid/tasks`);

        await expect(p).resolves.toHaveProperty('status', 404);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          expect.stringContaining('invalidid'),
        );
      });

      test('missing auth', async () => {
        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/sections/${section._id.toString()}/tasks`);

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
});
