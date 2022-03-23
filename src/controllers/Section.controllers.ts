import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

async function createSections(
  projectId: string,
  sectionData: [{ name: string, colour: string, icon: string }],
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
  }));

  return Promise.all(sections);
}

async function getSections(projectId: string): Promise<Section[] | null> {
  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return null;
    }

    const populatedProject = await project.populate<{ sections: Section[] }>('sections', '-__v');

    const { sections } = populatedProject;

    return sections;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function updateSection(
  sectionId: string,
  name?: string,
  colour?: string,
  icon?: string,
): Promise<Section | null> {
  try {
    const section = await SectionModel.findById(sectionId);
    if (section === null) {
      return null;
    }

    section.name = name ?? section.name;
    section.colour = colour ?? section.colour;
    section.icon = icon ?? section.icon;

    await section.save();

    return section;
  } catch (error) {
    return null;
  }
}

async function createTask(
  sectionId: string,
  name: string,
  dueDate: Date,
  assignee: string,
): Promise<Result<Task, 'ASSIGNEE_NOT_IN_PROJECT' | 'SECTION_NOT_FOUND'>> {
  try {
    const section = await SectionModel.findById(sectionId);
    if (!section) {
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
      };
    }

    const task = await new TaskModel({
      name,
      dueDate,
      assignee,
      created: new Date(),
      updated: new Date(),
      section: section._id,
    }).save();

    section.tasks.push(task._id);

    await section.save();

    return {
      type: 'success',
      data: task,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
    };
  }
}

export {
  createSections, createTask, getSections, updateSection,
};
