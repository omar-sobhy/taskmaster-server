import HttpException from '../HttpException';

class TaskNotFoundException extends HttpException {
  constructor(taskId: string) {
    super(404, `No task with id '${taskId}' found`);
  }
}

export default TaskNotFoundException;
