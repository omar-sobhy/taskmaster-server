import * as mongoose from 'mongoose';
import ChecklistItem from './ChecklistItem.interface';

const ChecklistItemSchema = new mongoose.Schema({
  status: String,
  description: String,
});

const ChecklistItemModel = mongoose.model<ChecklistItem>('ChecklistItem', ChecklistItemSchema);

export default ChecklistItemModel;
