import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import UserModel from '../database/User/User.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Result from '../interfaces/Result';

async function getProject(projectId: string): Promise<Result<Project, 'PROJECT_NOT_FOUND'>> {
  try {
    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return {
        type: 'error',
        errorType: 'PROJECT_NOT_FOUND',
        errorData: projectId,
      };
    }

    return {
      type: 'success',
      data: project,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
      errorData: projectId,
    };
  }
}

async function getProjects(
  userId: string,
): Promise<Result<Project[], 'USER_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>> {
  const user = await UserModel.findById(userId);

  if (user === null) {
    return {
      type: 'error',
      errorType: 'USER_NOT_FOUND',
    };
  }

  const populatedUser = await user.populate<{ projects: Project[] }>('projects');

  return {
    type: 'success',
    data: populatedUser.projects,
  };
}

async function createProject(userId: string, name: string): Promise<Project | null> {
  const user = await UserModel.findById(userId);
  if (!user) {
    return null;
  }

  const newProject = await new ProjectModel({
    name,
    background: '#c4c4c4',
    users: [userId],
  }).save();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  user.projects.push(newProject!.id);
  user.save();

  return newProject;
}

async function getSections(projectId: string): Promise<Section[] | null> {
  const project = await ProjectModel.findById(projectId);
  if (project === null) {
    return null;
  }

  const populatedProject = await project.populate<{ sections: Section[] }>('sections');

  return populatedProject.sections;
}

async function createSections(
  projectId: string,
  sectionData: [{ name: string; colour: string; icon: string }],
): Promise<Section[] | null> {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return null;
  }

  const sections = sectionData.map(({ name, colour, icon }) => new SectionModel({
    name,
    colour,
    icon,
    project: project.id,
  }).save());

  const allPromise = await Promise.all(sections);

  const ids = allPromise.map((s) => s._id.toString());

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  project.sections.concat(ids);
  project.sections = allPromise.map((s) => s._id);

  await project.save();

  return allPromise;
}

export default { createSections };

export {
  createProject, getProject, getProjects, getSections, createSections,
};
