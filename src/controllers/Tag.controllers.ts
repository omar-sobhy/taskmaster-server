import { ObjectId } from 'mongodb';
import Tag from '../database/Tag/Tag.interface';
import TagModel from '../database/Tag/Tag.model';
import Result from '../interfaces/Result';
import Project from '../database/Project/Project.interface';
import ProjectModel from '../database/Project/Project.model';
import Task from '../database/Task/Task.interface';
import TaskModel from '../database/Task/Task.model';

async function getTags(
  tagIds: string[],
): Promise<Result<Tag[], 'TAGS_NOT_FOUND'>> {
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

  const tagObjects = await Promise.all(
    tagIds.map((c) => TagModel.findById(c, '-__v')),
  );
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

async function updateTag(
  tagId: string,
  { colour, name }: Partial<{ colour: string; name: string }>,
): Promise<Result<Tag, 'TAG_NOT_FOUND'>> {
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

  if (name) {
    tag.name = name;
  }

  if (colour) {
    tag.colour = colour;
  }

  await tag.save();

  return {
    type: 'success',
    data: tag,
  };
}

async function deleteTag(
  tagId: string,
  userId: string,
): Promise<Result<Tag, 'TAG_NOT_FOUND'>> {
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

  const populatedTag = await tag.populate<{ project: Project; tasks: Task[] }>(
    'project',
    'tasks',
  );

  const { project } = populatedTag;

  const user = project.users.find((projectUser) => projectUser.toString() === userId);
  if (!user) {
    console.log(
      `User ${userId} tried to delete tag ${tagId} without appropriate permissions`,
    );

    return {
      type: 'error',
      errorType: 'TAG_NOT_FOUND',
      errorData: tagId,
    };
  }

  await ProjectModel.deleteOne({ _id: project._id });

  const { tasks } = populatedTag;

  tasks.forEach(async (t) => {
    const model = (await TaskModel.findById(t._id))!;

    const idx = model.tags.findIndex((taskTag) => taskTag._id.toString() === tagId);

    model.tags.splice(idx, 1);

    await model.save();
  });

  await populatedTag.delete();

  return {
    type: 'success',
    data: {
      _id: tag._id,
      colour: tag.colour,
      name: tag.name,
      project: tag.project._id,
      tasks: tag.tasks,
    },
  };
}

export { getTags, deleteTag, updateTag };
