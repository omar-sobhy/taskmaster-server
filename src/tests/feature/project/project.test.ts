import {
  beforeAll, beforeEach, describe, expect, test,
} from '@jest/globals';
import { ObjectId } from 'mongodb';
import request, { SuperAgentStatic } from 'superagent';
import { faker } from '@faker-js/faker';
import { signUp } from '../../../controllers/User.controllers';
import User from '../../../database/User/User.interface';
import { createProject, createSections } from '../../../controllers/Project.controllers';
import Project from '../../../database/Project/Project.interface';
import { Success } from '../../../interfaces/Result';
import Section from '../../../database/Section/Section.interface';

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
      const loginResult = await agent
        .post(`${basePath}/users/login`)
        .send({ username: user.username, password: 'password' });

      expect(loginResult.ok).toBe(true);
    }
  });

  describe('get all projects', () => {
    test('one project', async () => {
      const firstProject = await createProject(user._id.toString(), 'test', '');

      const secondUser = await signUp(faker.internet.userName(), 'password', 'cool@email.com');

      expect(secondUser).not.toBeNull();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const secondProject = await createProject(secondUser!._id.toString(), 'random name', '');

      expect(firstProject.type).toBe('success');
      expect(secondProject.type).toBe('success');

      const p = agent.get(`${basePath}/projects`);

      await expect(p).resolves.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: (firstProject as Success<Project>).data._id.toString(),
            }),
          ]),
        },
      });

      await expect(p).resolves.not.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: (secondProject as Success<Project>).data._id.toString(),
            }),
          ]),
        },
      });
    });

    test('many projects', async () => {
      const firstProject = await createProject(user._id.toString(), 'test', '');
      const secondProject = await createProject(user._id.toString(), 'random name', '');

      expect(firstProject.type).toBe('success');
      expect(secondProject.type).toBe('success');

      const p = agent.get(`${basePath}/projects`);

      await expect(p).resolves.toMatchObject({
        body: {
          projects: expect.arrayContaining([
            expect.objectContaining({
              _id: (firstProject as Success<Project>).data._id.toString(),
            }),
            expect.objectContaining({
              _id: (secondProject as Success<Project>).data._id.toString(),
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
      const project = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(project.type).toBe('success');

      const p = agent.get(`${basePath}/projects/${(project as Success<Project>).data._id}`);

      await expect(p).resolves.toMatchObject({
        body: {
          project: {
            _id: (project as Success<Project>).data._id.toString(),
          },
        },
      });
    });

    describe('invalid request', () => {
      test('missing auth', async () => {
        const project = await createProject(user._id.toString(), 'test', '');

        expect(project.type).toBe('success');

        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/projects/${(project as Success<Project>).data._id}`);

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

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const project = await createProject(anotherUser!._id.toString(), 'test', '');

        expect(project.type).toBe('success');

        // will use auth cookie for pre-created user

        const p = agent.get(`${basePath}/projects/${(project as Success<Project>).data._id}`);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          `No project with id '${(project as Success<Project>).data._id.toString()}' found`,
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

  describe('get sections by project id', () => {
    describe('valid request', () => {
      let project: Project;

      beforeEach(async () => {
        const result = await createProject(user._id.toString(), faker.word.noun(), '');

        expect(result.type).toBe('success');

        project = (result as Success<Project>).data;
      });

      test.each([
        { sections: [] },
        { sections: [{ name: 'Open', colour: '#bef9f2', icon: '' }] },
        {
          sections: [
            { name: 'Open', colour: '#bef9f2', icon: '' },
            { name: 'In progress', colour: '#35b6ff', icon: '' },
          ],
        },
      ])('has sections', async ({ sections }) => {
        const sectionsResult = await createSections(project._id.toString(), sections);

        expect(sectionsResult.type).toBe('success');

        const p = agent.get(`${basePath}/projects/${project._id.toString()}/sections`);

        await expect(p).resolves.toHaveProperty('status', 200);

        // eslint-disable-next-line arrow-body-style
        const expectedIds = (sectionsResult as Success<Section[]>).data.map((s) => {
          return expect.objectContaining({
            _id: s._id.toString(),
          });
        });

        await expect(p).resolves.toHaveProperty(
          'body.sections',
          expect.arrayContaining(expectedIds),
        );
      });
    });

    describe('invalid request', () => {
      test('missing auth', async () => {
        // use global request instead of agent with auth cookie
        const p = request.get(`${basePath}/projects/randomprojectid`);

        await expect(p).rejects.toHaveProperty('status', 401);

        await expect(p).rejects.toHaveProperty(
          'response.body.error.message',
          'Missing authentication token',
        );
      });

      test('invalid project id', async () => {
        const p = agent.get(`${basePath}/projects/invalidprojectid`);

        await expect(p).resolves.toHaveProperty('status', 404);

        await expect(p).resolves.toHaveProperty(
          'body.error.message',
          'No project with id \'invalidprojectid\' found',
        );
      });
    });
  });

  describe('create section', () => {
    let project: Project;

    beforeEach(async () => {
      const projectResult = await createProject(user._id.toString(), faker.word.noun(), '');

      expect(projectResult.type).toBe('success');

      project = (projectResult as Success<Project>).data;
    });

    test.each([
      { sections: [{ name: faker.word.noun(), colour: faker.color.rgb(), icon: '' }] },
      {
        sections: [
          { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
          { name: faker.word.noun(), colour: faker.color.rgb(), icon: '' },
        ],
      },
    ])('valid request', async ({ sections }) => {
      const p = agent.post(`${basePath}/projects/${project._id.toString()}/sections`).send({
        sections,
      });

      await expect(p).resolves.toHaveProperty('status', 200);

      const expectedSections = sections.map((s) => expect.objectContaining(s));

      await expect(p).resolves.toHaveProperty(
        'body.sections',
        expect.arrayContaining(expectedSections),
      );
    });

    describe('invalid request', () => {
      test('too long section name', async () => {
        const p = agent.post(`${basePath}/projects/${project._id.toString()}/sections`).send({
          sections: [
            {
              name: 'a'.repeat(256),
              colour: faker.color.rgb(),
              icon: '',
            },
          ],
        });

        await expect(p).resolves.toHaveProperty('status', 400);

        await expect(p).resolves.toHaveProperty('body.error.propsErrors.property', 'name');
        await expect(p).resolves.toHaveProperty('body.error.propsErrors.constraints', 'maxLength');
      });

      test('invalid colour string', async () => {});

      test.skip('invalid icon ID', async () => {});

      test('missing auth', async () => {});

      test.skip('missing permission to create section', async () => {});
    });
  });
});
