/* eslint-disable @typescript-eslint/naming-convention */
import { PojoMetadata } from './pojo-metadata';

export interface SEQUENCE_DATA {
  sequence_name: string;
  sequence_increment: number;
  sequence_min_value: number;
  sequence_max_value: number;
  sequence_cur_value: number | null;
  sequence_cycle: number;
}

export class SEQUENCE_DATAMetadata implements PojoMetadata {
  constructor() {}

  getIdField(): string {
    return 'sequence_name';
  }

  getTableName(): string {
    return 'SEQUENCE_DATA';
  }

  getUpdatableFields(): string[] {
    return ['sequence_increment', 'sequence_min_value', 'sequence_max_value', 'sequence_cur_value', 'sequence_cycle'];
  }

  getInsertableFields(): string[] {
    return [
      'sequence_name',
      'sequence_increment',
      'sequence_min_value',
      'sequence_max_value',
      'sequence_cur_value',
      'sequence_cycle',
    ];
  }
}
