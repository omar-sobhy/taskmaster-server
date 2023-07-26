import HttpException from '../HttpException';

class AssigneeNotInProjectException extends HttpException {
  constructor(assignee: string, project: string) {
    super(403, `Assignee '${assignee}' not in project '${project}'`, [{ property: 'assignee' }]);
  }
}

export default AssigneeNotInProjectException;
