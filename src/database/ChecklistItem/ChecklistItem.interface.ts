enum ChecklistItemStatus {
  DONE,
  IN_PROGRESS,
}

interface ChecklistItem {
  status: ChecklistItemStatus
  description: string
}

export { ChecklistItemStatus };
export default ChecklistItem;
