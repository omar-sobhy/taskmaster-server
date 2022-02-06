import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import UserModel from '../database/User/User.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Result from '../interfaces/Result';

async function getProjects(userId: string)
  : Promise<Result<Project[], 'USER_NOT_FOUND'>> {
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

async function createProject(userId: string, name: string)
  : Promise<Result<Project, 'USER_NOT_FOUND'>> {
  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      type: 'error',
      errorType: 'USER_NOT_FOUND',
    };
  }

  const newProject = await new ProjectModel({
    name,
    background: '#c4c4c4',
    users: [userId],
  }).save();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  user.projects.push(newProject!.id);
  user.save();

  return {
    type: 'success',
    data: newProject,
  };
}

async function getSections(projectId: string)
  : Promise<Result<Section[], 'PROJECT_NOT_FOUND'>> {
  const project = await ProjectModel.findById(projectId);
  if (project === null) {
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
    };
  }

  const populatedProject = await project.populate< { sections: Section[] }>('sections', '-__v');

  return {
    type: 'success',
    data: populatedProject.sections,
  };
}

async function createSections(
  projectId: string,
  sectionData: [{ name: string, colour: string, icon: string }],
): Promise<Result<Section[], 'PROJECT_NOT_FOUND'>> {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
    };
  }

  const sections = sectionData.map(({ name, colour, icon }) => new SectionModel({
    name,
    colour,
    icon,
    project: project.id,
  }).save());

  const allPromise = await Promise.all(sections);

  const ids = allPromise.map((s) => s._id.toString());

  project.sections.concat(ids);
  project.sections = allPromise.map((s) => s._id);

  await project.save();

  return {
    type: 'success',
    data: allPromise,
  };
}

export {
  createProject, getProjects, getSections, createSections,
};
