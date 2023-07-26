import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import User from '../../../database/User/User.interface';
import { signUp } from '../../../controllers/User.controllers';
import { createProject, createSections } from '../../../controllers/Project.controllers';
import Project from '../../../database/Project/Project.interface';
import Section from '../../../database/Section/Section.interface';
import Task from '../../../database/Task/Task.interface';
import { Success } from '../../../interfaces/Result';
import { createTask } from '../../../controllers/Section.controllers';

describe('task', () => {
  const useHttps = process.env.USE_HTTPS;
  const taskmasterPort = process.env.TASKMASTER_PORT;

  const basePath = `${useHttps ? 'https' : 'http'}://localhost:${taskmasterPort}`;

  let agent: SuperAgentStatic;
  let user: User;
  let project: Project;
  let section: Section;
  let task: Task;

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

      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;

      const sectionResult = await createSections(project._id.toString(), [
        {
          name: faker.word.noun(),
          colour: faker.color.rgb(),
          icon: '',
        },
      ]);

      expect(sectionResult.type).toBe('success');

      [section] = (sectionResult as Success<Section[]>).data;

      const taskResult = await createTask(section._id.toString(), faker.word.noun());

      expect(taskResult.type).toBe('success');

      task = (taskResult as Success<Task>).data;
    }
  });

  describe('get task by id', () => {
    test('valid request', async () => {
      const p = agent.get(`${basePath}/tasks/${task._id.toString()}`);

      await expect(p).resolves.toHaveProperty('status', 200);

      await expect(p).resolves.toHaveProperty('body.task._id', task._id.toString());
    });

    describe('invalid request', () => {
      test('missing task id', async () => {
        const p = agent.get(`${basePath}/tasks//`);

        await expect(p).resolves.toHaveProperty('status', 404);
      });

      test('invalid task id', async () => {
        const p = agent.get(`${basePath}/tasks/invalidid`);

        await expect(p).resolves.toHaveProperty('status', 404);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          expect.stringContaining('invalidid'),
        );
      });

      test('missing auth', async () => {
        const p = request.get(`${basePath}/tasks/${task._id.toString()}`);

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

  describe('update task', () => {
    describe('valid request', () => {
      // have to add this assignee: 'add' and tags: n hack
      // because jest runs test.each() before the test-global beforeAll runs
      // so project and user are null at the time
      test.each([
        {},
        {
          description: faker.lorem.lines(5),
          dueDate: faker.date.future(),
          assignee: 'add',
          tags: 1,
        },
        {
          description: faker.lorem.lines(5),
          dueDate: faker.date.future(),
          assignee: 'add',
        },
        {
          description: faker.lorem.lines(5),
          dueDate: faker.date.future(),
          tags: 1,
        },
        {
          description: faker.lorem.lines(5),
          assignee: 'add',
          tags: 1,
        },
        {
          dueDate: faker.date.future(),
          assignee: 'add',
          tags: 1,
        },
        {
          description: faker.lorem.lines(5),
          dueDate: faker.date.future(),
          assignee: 'add',
          tags: 2,
        },
        {
          description: faker.lorem.lines(5),
          dueDate: faker.date.future(),
          assignee: 'add',
          tags: 0,
        },
      ])('good task data', async ({
        assignee, description, dueDate, tags,
      }) => {
        const p = agent.patch(`${basePath}/tasks/${task._id.toString()}`).send({
          assignee: assignee ? user._id.toString() : undefined,
          description,
          dueDate: dueDate?.toISOString(),
          tags: project.tags.slice(0, tags),
        });

        const expectedObject: Partial<{
          assignee: string;
          description: string;
          dueDate: string;
          tags: string[];
        }> = {};

        if (assignee) expectedObject.assignee = user._id.toString();
        if (description) expectedObject.description = description;
        if (dueDate) expectedObject.dueDate = dueDate.toISOString();

        const res = await p;

        await expect(p).resolves.toHaveProperty('status', 200);

        await expect(p).resolves.toHaveProperty(
          'body.task',
          expect.objectContaining(expectedObject),
        );
      });
    });

    describe('invalid request', () => {
      test.each([
        {
          name: 'a'.repeat(201),
          errorPath: 'name',
        },
        {
          dueDate: '27/04/2023',
          errorPath: 'dueDate',
        },
        {
          assignee: 'invalidid',
          errorPath: 'assignee',
        },
        {
          description: 'a'.repeat(10001),
          errorPath: 'description',
        },
        {
          tags: ['invalidid'],
          errorPath: 'tags.0',
        },
      ])('bad task data', async ({
        assignee, description, dueDate, name, tags, errorPath,
      }) => {
        const p = agent.patch(`${basePath}/tasks/${task._id.toString()}`).send({
          assignee,
          description,
          dueDate,
          name,
          tags,
        });

        await expect(p).resolves.toHaveProperty('status', 403);

        await expect(p).resolves.toHaveProperty('body.error.propsErrors.0.property', errorPath);
      });

      test('missing taskId', async () => {
        const p = agent.patch(`${basePath}/tasks//`).send({
          name: 'test',
        });

        await expect(p).resolves.toHaveProperty('status', 404);
      });

      test('invalid taskId', async () => {
        const p = agent.patch(`${basePath}/tasks/invalidid/`).send({
          name: 'test',
        });

        await expect(p).resolves.toHaveProperty('status', 404);
      });

      test('missing auth', async () => {
        const p = request.patch(`${basePath}/tasks/${task._id.toString()}`).send({
          name: 'test',
        });

        expect(p).rejects.toMatchObject({
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
