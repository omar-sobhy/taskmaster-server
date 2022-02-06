import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

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
  }));

  return {
    type: 'success',
    data: await Promise.all(sections),
  };
}

async function getSections(projectId: string)
  : Promise<Result<Section[], 'PROJECT_NOT_FOUND'>> {
  try {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return {
        type: 'error',
        errorType: 'PROJECT_NOT_FOUND',
      };
    }

    const populatedProject = await project.populate<{ sections: Section[] }>('sections', '-__v');

    const { sections } = populatedProject;

    return {
      type: 'success',
      data: sections,
    };
  } catch (error) {
    console.error(error);
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
    };
  }
}

async function updateSection(
  sectionId: string,
  name?: string,
  colour?: string,
  icon?: string,
): Promise<Result<Section, 'SECTION_NOT_FOUND'>> {
  try {
    const section = await SectionModel.findById(sectionId);
    if (section === null) {
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
      };
    }

    section.name = name ?? section.name;
    section.colour = colour ?? section.colour;
    section.icon = icon ?? section.icon;

    await section.save();

    return {
      type: 'success',
      data: section,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
    };
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const project = (await ProjectModel.findById(section.project))!;
    const user = project.users.find((u) => u.toString() === assignee);
    if (!user) {
      return {
        type: 'error',
        errorType: 'ASSIGNEE_NOT_IN_PROJECT',
        errorData: '',
      };
    }

    const task = await new TaskModel({
      name,
      dueDate,
      assignee,
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
