import * as mongoose from 'mongoose';
import Section from './Section.interface';

const SectionSchema = new mongoose.Schema({
  name: String,
  colour: String,
  icon: String,

  project: {
    ref: 'Project',
    type: mongoose.Schema.Types.ObjectId,
  },
  tasks: [{
    ref: 'Task',
    type: mongoose.Schema.Types.ObjectId,
  }],
});

const SectionModel = mongoose.model<Section>('Section', SectionSchema);

export default SectionModel;
