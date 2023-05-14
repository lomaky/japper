/* eslint-disable @typescript-eslint/naming-convention */

export interface PojoMetadata {
  getIdField(): string;
  getTableName(): string;
  getUpdatableFields(): string[];
  getInsertableFields(): string[];
  mapToPatch(entity: any): any;
  mergePatch(patch: any, entity: any): any;
}
