import { ObjectId } from 'mongodb';
import Tag from '../database/Tag/Tag.interface';
import TagModel from '../database/Tag/Tag.model';
import Result from '../interfaces/Result';

async function getTagData(tagIds: string[]): Promise<Result<Tag[], 'TAGS_NOT_FOUND'>> {
  const objectIdsOrError = tagIds.map((t) => {
    try {
      return new ObjectId(t);
    } catch (error) {
      return {
        errorData: t,
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
      errorType: 'TAGS_NOT_FOUND',
      errorData: errorObject,
    };
  }

  const tagObjects = await Promise.all(tagIds.map((c) => TagModel.findById(c, '-__v')));
  const invalidIds = tagIds.filter((tagId, index) => !tagObjects[index]);
  if (invalidIds.length !== 0) {
    return {
      type: 'error',
      errorType: 'TAGS_NOT_FOUND',
      errorData: invalidIds,
    };
  }

  return {
    type: 'success',
    data: tagObjects as Tag[],
  };
}

async function updateTag(tagId: string, name: string): Promise<Result<Tag, 'TAG_NOT_FOUND'>> {
  try {
    // eslint-disable-next-line no-new
    new ObjectId(tagId);
  } catch (error) {
    return {
      type: 'error',
      errorType: 'TAG_NOT_FOUND',
      errorData: tagId,
    };
  }

  const tag = await TagModel.findById(tagId);
  if (!tag) {
    return {
      type: 'error',
      errorType: 'TAG_NOT_FOUND',
      errorData: tagId,
    };
  }

  tag.name = name;

  await tag.save();

  return {
    type: 'success',
    data: tag,
  };
}

export { getTagData, updateTag };
