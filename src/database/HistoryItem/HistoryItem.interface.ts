enum HistoryItemType {
  CREATE,
  ASSIGN,
  UPDATE,
}

interface HistoryItem {
  type: HistoryItemType
  dateTime: Date
  detail: string
}

export { HistoryItemType };
export default HistoryItem;
