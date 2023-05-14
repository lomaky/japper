import { DBTransactionType } from './db-transaction-type';
import { PojoMetadata } from './pojo-metadata';

export class DBTransaction {
  protected _transactionType: DBTransactionType;
  protected _pojoMetadata: PojoMetadata;
  protected _entity: any;

  constructor(transactionType: DBTransactionType, pojoMetadata: PojoMetadata, entity: any) {
    this._transactionType = transactionType;
    this._pojoMetadata = pojoMetadata;
    this._entity = entity;
  }

  public get entity(): any {
    return this._entity;
  }

  public get transactionType(): DBTransactionType {
    return this._transactionType;
  }

  public get pojoMetadata(): PojoMetadata {
    return this._pojoMetadata;
  }
}
