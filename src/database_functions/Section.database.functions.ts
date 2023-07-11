import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

async function createSections(
  projectId: string,
  sectionData: [{ name: string; colour: string; icon: string }],
): Promise<Result<Section[], 'PROJECT_NOT_FOUND'>> {
  const project = await ProjectModel.findById(projectId);
  if (!project) {
    return {
      type: 'error',
      errorType: 'PROJECT_NOT_FOUND',
    };
  }

  const sections = sectionData.map(
    ({ name, colour, icon }) => new SectionModel({
      name,
      colour,
      icon,
      project: project.id,
    }),
  );

  return {
    type: 'success',
    data: await Promise.all(sections),
  };
}

async function getSection(
  userId: string,
  sectionId: string,
): Promise<Result<Section, 'SECTION_NOT_FOUND'>> {
  try {
    const section = await SectionModel.findById(sectionId);

    if (!section) {
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
        errorData: sectionId,
      };
    }

    const project = await ProjectModel.findById(section.project);

    if (!project) {
      console.error(
        `User ${userId} attempted to get section ${sectionId} but no parent project was found.`,
      );
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
        errorData: sectionId,
      };
    }

    if (!project.users.find((u) => u.toString() === userId)) {
      console.log(`User ${userId} tried to get section ${sectionId} without permission.`);
      return {
        type: 'error',
        errorType: 'SECTION_NOT_FOUND',
        errorData: sectionId,
      };
    }

    return {
      type: 'success',
      data: section,
    };
  } catch (error) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionId,
    };
  }
}

async function getSections(projectId: string): Promise<Result<Section[], 'PROJECT_NOT_FOUND'>> {
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
  dueDate: Date | undefined,
  assignee: string | undefined,
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
    if (assignee) {
      const user = project.users.find((u) => u.toString() === assignee);
      if (!user) {
        return {
          type: 'error',
          errorType: 'ASSIGNEE_NOT_IN_PROJECT',
          errorData: project._id,
        };
      }
    }

    const data: Record<string, unknown> = {
      name,
      created: new Date(),
      updated: new Date(),
      section: section._id,
    };

    if (dueDate) data.dueDate = dueDate;
    if (assignee) data.assignee = assignee;

    const task = await new TaskModel(data).save();

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

async function deleteSection(
  sectionId: string,
  userId: string,
): Promise<Result<Section, 'SECTION_NOT_FOUND'>> {
  const section = await SectionModel.findById(sectionId);

  if (!section) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionId,
    };
  }

  const populatedSection = await section.populate<{ project: Project; tasks: Task[] }>(
    'project tasks',
  );

  const { project, tasks } = populatedSection;

  if (!project.users.find((id) => id.toString() === userId)) {
    console.log(`User '${userId}' tried removing section '${sectionId}' without permission`);

    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionId,
    };
  }

  tasks.forEach(async (task) => {
    const model = new TaskModel(task._id);
    await model.delete();
  });

  await section.delete();

  const model = new ProjectModel(project._id);
  const idx = model.sections.findIndex((id) => id.toString() === sectionId);
  model.sections.splice(idx, 1);
  await model.save();

  return {
    type: 'success',
    data: section,
  };
}

export {
  createSections, createTask, getSection, getSections, updateSection, deleteSection,
};
