import * as mongoose from 'mongoose';
import Project from './Project.interface';

const ProjectSchema = new mongoose.Schema({
  name: String,
  background: String,

  users: [{
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
  }],

  sections: [{
    ref: 'Section',
    type: mongoose.Schema.Types.ObjectId,
  }],
});

const ProjectModel = mongoose.model<Project>('Project', ProjectSchema);

export default ProjectModel;
