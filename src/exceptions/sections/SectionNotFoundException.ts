import HttpException from '../HttpException';

class SectionNotFoundException extends HttpException {
  constructor(sectionId: string) {
    super(404, `No section with id '${sectionId}' found`);
  }
}

export default SectionNotFoundException;
