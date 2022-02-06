import ProjectModel from '../database/Project/Project.model';
import SectionModel from '../database/Section/Section.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';
import Result from '../interfaces/Result';

async function createTask(
  sectionId: string,
  name: string,
  dueDate?: Date,
  assignee?: string,
): Promise<Result<Task, 'SECTION_NOT_FOUND' | 'USER_NOT_IN_PROJECT'>> {
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
        errorType: 'USER_NOT_IN_PROJECT',
      };
    }

    const task = await new TaskModel({
      name,
      dueDate,
      assignee,
    }).save();

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

export { createTask };
