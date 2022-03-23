import HttpException from '../HttpException';

class CommentsNotFoundException extends HttpException {
  constructor(commentIds: string[]) {
    super(404, `Comments not found: \`${commentIds}\``);
  }
}

export default CommentsNotFoundException;
