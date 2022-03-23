import { ObjectId } from 'mongodb';
import Comment from '../database/Comment/Comment.interface';
import CommentModel from '../database/Comment/Comment.model';
import Result from '../interfaces/Result';

async function getComments(commentIds: string[]): Promise<Result<Comment[], 'COMMENTS_NOT_FOUND'>> {
  const objectIdsOrError = commentIds.map((c) => {
    try {
      return new ObjectId(c);
    } catch (error) {
      return {
        errorData: c,
      };
    }
  });

  // eslint-disable-next-line no-prototype-builtins
  const errors = objectIdsOrError.filter((obj) => obj.hasOwnProperty('errorData')) as { errorData: string }[];
  if (errors.length !== 0) {
    // eslint-disable-next-line arrow-body-style
    const errorObject = errors.reduce((accumulator, currentValue) => {
      return accumulator.concat(currentValue.errorData);
    }, [] as string[]);

    return {
      type: 'error',
      errorType: 'COMMENTS_NOT_FOUND',
      errorData: errorObject,
    };
  }

  const commentObjects = await Promise.all(commentIds.map((c) => CommentModel.findById(c, '-__v')));
  const invalidIds = commentIds.filter((commentId, index) => !commentObjects[index]);
  if (invalidIds.length !== 0) {
    return {
      type: 'error',
      errorType: 'COMMENTS_NOT_FOUND',
      errorData: invalidIds,
    };
  }

  return {
    type: 'success',
    data: commentObjects as Comment[],
  };
}

async function updateComment(commentId: string, text: string) {
  try {
    // eslint-disable-next-line no-new
    new ObjectId(commentId);
  } catch (error) {
    return {
      type: 'error',
      errorType: 'COMMENT_NOT_FOUND',
      errorData: commentId,
    };
  }

  const comment = await CommentModel.findById(commentId);
  if (!comment) {
    return {
      type: 'error',
      errorType: 'COMMENT_NOT_FOUND',
      errorData: commentId,
    };
  }

  comment.text = text;

  await comment.save();

  return {
    type: 'success',
    data: comment,
  };
}

export { getComments, updateComment };
