import HttpException from '../HttpException';

class ProjectNotFoundException extends HttpException {
  constructor(projectId: string) {
    super(404, `No project with id '${projectId}' found`);
  }
}

export default ProjectNotFoundException;
