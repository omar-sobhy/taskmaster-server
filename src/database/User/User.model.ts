import * as mongoose from 'mongoose';
import User from './User.interface';

const UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,

  projects: [{
    ref: 'Project',
    type: mongoose.Schema.Types.ObjectId,
  }],
});

const UserModel = mongoose.model<User>('User', UserSchema);

export default UserModel;
