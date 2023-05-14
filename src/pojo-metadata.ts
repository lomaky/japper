/* eslint-disable @typescript-eslint/naming-convention */

export interface PojoMetadata {
  getIdField(): string;
  getTableName(): string;
  getUpdatableFields(): string[];
  getInsertableFields(): string[];
}
