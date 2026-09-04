export type SortOrder = 'ASC' | 'DESC';

export class SortOptions<SortKeysEnum> {
  sortKey: SortKeysEnum;
  sortOrder: SortOrder;
}
