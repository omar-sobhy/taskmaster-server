import { isValidObjectId } from 'mongoose';
import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import Section from '../database/Section/Section.interface';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

async function createSections(
  projectId: string,
  sectionData: { name: string; colour: string; icon: string }[],
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

async function getSection(sectionId: string): Promise<Result<Section, 'SECTION_NOT_FOUND'>> {
  try {
    const section = await SectionModel.findById(sectionId);

    if (!section) {
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

async function getSections(sectionIds: string[]): Promise<Result<Section[], 'SECTION_NOT_FOUND'>> {
  const sectionPromises = sectionIds.map(async (s) => {
    try {
      const section = await SectionModel.findById(s);
      return {
        type: 'success' as const,
        data: section,
      };
    } catch (error) {
      return {
        type: 'error' as const,
        data: s,
      };
    }
  });

  const sectionsOrErrors = await Promise.all(sectionPromises);

  const errors = sectionsOrErrors.filter((o) => o.type === 'error');

  if (errors.length !== 0) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: errors[0].data,
    };
  }

  const sections = sectionsOrErrors.map((o) => o.data);

  return {
    type: 'success',
    data: sections as Section[],
  };
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

async function getTasks(sectionId: string): Promise<Result<Task[], 'SECTION_NOT_FOUND'>> {
  if (!isValidObjectId(sectionId)) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionId,
    };
  }

  const section = await SectionModel.findById(sectionId, '-__v');
  if (!section) {
    return {
      type: 'error',
      errorType: 'SECTION_NOT_FOUND',
      errorData: sectionId,
    };
  }

  const populatedSection = await section.populate<{ tasks: Task[] }>('tasks');

  return {
    type: 'success',
    data: populatedSection.tasks,
  };
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
  createSections, createTask, getSection, getSections, getTasks, updateSection, deleteSection,
};
