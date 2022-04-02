import HttpException from '../HttpException';

class TagsNotFoundException extends HttpException {
  constructor(tagIds: string[]) {
    super(404, `Tags not found: \`${tagIds}\``);
  }
}

export default TagsNotFoundException;
