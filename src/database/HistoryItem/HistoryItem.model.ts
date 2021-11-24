import * as mongoose from 'mongoose';
import HistoryItem from './HistoryItem.interface';

const HistoryItemSchema = new mongoose.Schema({
  type: String,
  dateTime: Date,
  detail: String,
});

const HistoryItemModel = mongoose.model<HistoryItem>('HistoryItem', HistoryItemSchema);

export default HistoryItemModel;
