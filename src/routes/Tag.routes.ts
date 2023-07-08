import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { getTagData } from '../database_functions/Tag.database.functions';
import TagsNotFoundException from '../exceptions/tags/TagsNotFoundException';
import authMiddleware from '../middleware/auth.middleware';
import { updateTag } from '../database_functions/Tag.database.functions';

class TagRoutes implements RouterWrapper {
  public path = '/tags';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, TagRoutes.getTagData);

    this.router.post(`${this.path}/:tagId`, TagRoutes.updateTagName);
  }

  private static async getTagData(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.query;
    if (!tagId) {
      res.json({
        tags: [],
      }).end();
      return;
    }

    const tagsOrError = await (typeof tagId === 'string'
      ? getTagData([tagId])
      : getTagData(tagId as string[]));

    if (tagsOrError.type === 'error') {
      next(new TagsNotFoundException(tagsOrError.errorData as string[]));
      return;
    }

    const tags = tagsOrError.data;

    res.json({
      tags,
    }).end();
  }

  private static async updateTagName(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.params;
    const { name } = req.body;
    
    if (!tagId) {
      next(new TagsNotFoundException([tagId]));
      return;
    }

    const tagOrError = await updateTag(tagId, name);

    if (tagOrError.type === 'error') {
      next(new TagsNotFoundException([tagOrError.errorData as string]));
      return;
    }

    res.json({
      tag: tagOrError.data,
    }).end();
  }
}

export default TagRoutes;
