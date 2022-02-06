import HttpException from '../HttpException';

class AssigneeNotInProjectException extends HttpException {
  constructor(assignee: string, project: string) {
    super(500, `Assignee '${assignee}' not in project '${project}'`);
  }
}

export default AssigneeNotInProjectException;
