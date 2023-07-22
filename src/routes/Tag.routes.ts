import {
  NextFunction, Request, Response, Router,
} from 'express';
import RouterWrapper from '../controllers/RouterWrapper.interface';
import { deleteTag, getTags, updateTag } from '../controllers/Tag.controllers';
import TagsNotFoundException from '../exceptions/tags/TagsNotFoundException';
import authMiddleware from '../middleware/auth.middleware';
import RequestWithUser from '../interfaces/RequestWithUser.interface';
import validationMiddleware from '../middleware/validation.middleware';
import UpdateTagDto from '../dtos/Tags/UpdateTag.dto';

class TagRoutes implements RouterWrapper {
  public path = '/tags';

  public router = Router();

  public constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.all(`${this.path}`, authMiddleware);
    this.router.all(`${this.path}/*`, authMiddleware);

    this.router.get(`${this.path}`, TagRoutes.getTag);

    this.router.post(
      `${this.path}/:tagId`,
      validationMiddleware(UpdateTagDto),
      TagRoutes.updateTag,
    );

    this.router.delete(`${this.path}/:tagId`, TagRoutes.deleteTag);
  }

  private static async getTag(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.query;
    if (!tagId) {
      res
        .json({
          tags: [],
        })
        .end();
      return;
    }

    const tagsOrError = await (typeof tagId === 'string'
      ? getTags([tagId])
      : getTags(tagId as string[]));

    if (tagsOrError.type === 'error') {
      next(new TagsNotFoundException(tagsOrError.errorData as string[]));
      return;
    }

    const tags = tagsOrError.data;

    res
      .json({
        tags,
      })
      .end();
  }

  private static async updateTag(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.params;
    const { colour, name } = req.body;

    if (!tagId) {
      next(new TagsNotFoundException(['undefined']));
      return;
    }

    const tagOrError = await updateTag(tagId, { colour, name });

    if (tagOrError.type === 'error') {
      next(new TagsNotFoundException([tagOrError.errorData as string]));
      return;
    }

    res
      .json({
        tag: tagOrError.data,
      })
      .end();
  }

  private static async deleteTag(req: Request, res: Response, next: NextFunction) {
    const { tagId } = req.params;
    if (!tagId) {
      next(new TagsNotFoundException(['undefined']));
      return;
    }

    const { user } = req as RequestWithUser;

    const tagOrError = await deleteTag(tagId, user._id.toString());

    if (tagOrError.type === 'error') {
      next(new TagsNotFoundException([tagOrError.errorData as string]));
      return;
    }

    res
      .json({
        tag: tagOrError.data,
      })
      .end();
  }
}

export default TagRoutes;
