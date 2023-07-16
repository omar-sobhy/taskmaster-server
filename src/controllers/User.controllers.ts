import bcrypt from 'bcrypt';
import { promisify } from 'util';
import { ObjectId } from 'mongoose';
import User from '../database/User/User.interface';
import UserModel from '../database/User/User.model';
import Project from '../database/Project/Project.interface';

function hash(password: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const hash = promisify(bcrypt.hash);

  const hashedPassword = hash(password, 10);

  return hashedPassword;
}
async function getById(userId: string | ObjectId): Promise<User | null> {
  return UserModel.findById(userId);
}

async function getByIds(userIds: string[] | ObjectId[]): Promise<User[] | string[]> {
  const usersAndErrors = await Promise.all(
    userIds.map(async (id) => {
      try {
        const user = await UserModel.findById(id, '-password -__v');
        if (user === null) {
          return id;
        }
        return user;
      } catch (error) {
        return id;
      }
    }),
  );

  const errors = usersAndErrors.filter((obj) => typeof obj === 'string') as string[];
  if (errors.length !== 0) {
    return errors;
  }

  return usersAndErrors as User[];
}

async function login(username: string, password: string): Promise<User | null> {
  const user = await UserModel.findOne({
    username: { $regex: new RegExp(username), $options: 'i' },
  });

  if (user === null) {
    return null;
  }

  const hashedPassword = user.password;

  const result = await bcrypt.compare(password, hashedPassword);

  if (!result) {
    return null;
  }

  return user;
}

async function signUp(username: string, password: string, email: string): Promise<User | null> {
  const existingUser = await UserModel.findOne({
    username: { $regex: new RegExp(username), $options: 'i' },
  });

  if (existingUser !== null) {
    return null;
  }

  const hashedPassword = await hash(password);

  const user = new UserModel({
    username,
    password: hashedPassword,
    email,
  }).save();

  return user;
}

async function projects(id: string): Promise<Project[] | null> {
  const user = await UserModel.findById(id);

  if (user === null) {
    return null;
  }

  const populatedUser = await user.populate<{ projects: Project[] }>('projects', '-password -__v');

  return populatedUser.projects;
}

export {
  getById, getByIds, login, signUp, projects as getProjects,
};
