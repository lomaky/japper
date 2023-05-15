/* eslint-disable @typescript-eslint/naming-convention */
import { Connection, MysqlError, PoolConnection, createPool, Pool, PoolConfig } from 'mysql';
import { JapperConfig } from './japper-config';
import { DBTransactionType } from './db-transaction-type';
import { DBTransaction } from './db-transaction';
import { PojoMetadata } from './pojo-metadata';
import { Queue } from './queue';

export class Japper {
  private _pool: Pool;
  private _maxNumberCachedIds: number = 99;
  private _IDs = new Queue<number>();
  private _sequenceId = 'ID_SEQ';
  private _getIdentitySql = "SELECT nextval('" + this._sequenceId + "') as nextval";
  private _verbose = false;

  public constructor(config: JapperConfig) {
    const dbConfigMySql = {
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.schema,
      port: config.port,
      connectionLimit: 15,
      queueLimit: 30,
      acquireTimeout: 1000000,
    } as PoolConfig;
    this._pool = createPool(dbConfigMySql);
    this._verbose = config.verbose;
  }

  private log(message: any) {
    if (this._verbose) {
      this.log(message);
    }
  }

  public async getId(): Promise<number> {
    if (this._IDs.size() < 10) {
      const seqId = await this.getNextSeqId();
      for (let i = 0; i < this._maxNumberCachedIds - 1; i++) {
        this._IDs.enqueue(seqId + i);
      }
    }
    const newId = this._IDs.dequeue();
    if (newId) {
      return newId;
    }
    throw new Error('Unable to obtain ID');
  }

  private async getNextSeqId(): Promise<number> {
    this.log('query: ' + this._getIdentitySql);
    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(this._getIdentitySql, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        return success(rows[0].nextval as number);
      });
    });
  }

  public getConnectionPool(): Pool {
    return this._pool;
  }

  public getListPagedQuery(
    metadata: PojoMetadata,
    conditions: string,
    pageNumber: number,
    rowsPerPage: number,
    orderBy: string,
    asc: boolean,
  ): string {
    return (
      'SELECT * FROM ' +
      metadata.getTableName() +
      ' ' +
      conditions +
      ' ' +
      'Order By ' +
      orderBy +
      (asc ? ' asc ' : ' desc ') +
      ' LIMIT ' +
      (pageNumber - 1) * rowsPerPage +
      ',' +
      rowsPerPage +
      ''
    );
  }

  public query<T>(sql: string, parameters: Map<string, any>): Promise<T[]> {
    return new Promise<T[]>(async (success, failure) => {
      this.getConnectionPool().query(sql, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(sql, parameters, rows);
        return success(rows as T[]);
      });
    });
  }

  public queryExecute(sql: string, parameters: Map<string, any>): Promise<number> {
    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(sql, parameters, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(sql, null, rows);
        return success(rows as number);
      });
    });
  }

  public getPojo(table: string, isView: boolean): Promise<string | null> {
    const pojogen = isView ? 'pojoviewgen' : 'pojogen';
    const query = `select ${pojogen}('${table}') as POJOGEN`;
    const parameters = new Map([['TABLE', table]]);
    return new Promise<string>(async (success, failure) => {
      this.getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0].POJOGEN);
      });
    });
  }

  public getQueryCount<T>(sql: string, parameters: Map<string, any>): Promise<number> {
    const query = 'SELECT COUNT(1) as entityCount ' + sql.substring(sql.indexOf('FROM'));
    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0].entityCount as number);
      });
    });
  }

  public getEntitiesCount<T>(metadata: PojoMetadata, parameters: Map<string, any>): Promise<number> {
    let query = 'SELECT COUNT(1) as entityCount FROM ' + metadata.getTableName() + ' WHERE 1 = 1 ';
    parameters.forEach((value: object, key: string) => {
      query += ' AND ' + key + ' = ?';
    });
    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0].entityCount as number);
      });
    });
  }

  public getEntityById<T>(metadata: PojoMetadata, entityId: number): Promise<T> {
    const query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE ID = ? ';
    const parameters = new Map([['ID', entityId]]);

    return new Promise<T>(async (success, failure) => {
      this.getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0] as T);
      });
    });
  }

  public getEntities<T>(metadata: PojoMetadata, parameters: Map<string, any>): Promise<T[]> {
    let query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE 1 = 1 ';
    parameters.forEach((value: object, key: string) => {
      query += ' AND ' + key + ' = ?';
    });

    return new Promise<T[]>(async (success, failure) => {
      this.getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows as T[]);
      });
    });
  }

  public getIdListForQuery(ids: number[]): string {
    let idListStr = ' (';
    ids.forEach((id: number) => {
      idListStr += id + ',';
    });
    idListStr += ' -100) ';
    return idListStr;
  }

  public getEntitiesByReferenceIds<T>(metadata: PojoMetadata, referenceIdName: string, ids: number[]): Promise<T[]> {
    const query =
      'SELECT * FROM ' + metadata.getTableName() + ' WHERE ' + referenceIdName + ' IN ' + this.getIdListForQuery(ids);

    return new Promise<T[]>(async (success, failure) => {
      this.getConnectionPool().query(query, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, null, rows);
        return success(rows as T[]);
      });
    });
  }

  public getEntitiesByIds<T>(metadata: PojoMetadata, ids: number[]): Promise<T[]> {
    const query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE ID IN ' + this.getIdListForQuery(ids);

    return new Promise<T[]>(async (success, failure) => {
      this.getConnectionPool().query(query, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(query, null, rows);
        return success(rows as T[]);
      });
    });
  }

  private logResults(query: string, parameters: Map<string, any> | null, rows: any): void {
    if (this._verbose) {
      console.debug('query: ' + query);
      if (parameters) {
        console.debug('parameters:' + [...parameters.values()]);
      }
      if (rows && rows.length) {
        console.debug('results:' + rows.length);
      }
    }
  }

  public update<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
    const parameters = new Array();
    // update sql
    let updateSql = `UPDATE ${metadata.getTableName()} SET `;
    // update fields
    metadata.getUpdatableFields().forEach((field) => {
      updateSql += `${field} = ?, `;
      parameters.push(entity[field]);
    });
    // remove last comma
    updateSql = updateSql.substring(0, updateSql.lastIndexOf(','));
    updateSql += ` WHERE ${metadata.getIdField()} = ?`;
    parameters.push(entity[metadata.getIdField()]);

    if (conn) {
      return new Promise<number>(async (success, failure) => {
        conn.query(updateSql, parameters, (err, rows) => {
          if (err) {
            this.log(err);
            failure(err);
          }
          this.logResults(updateSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(updateSql, parameters, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(updateSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public add<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
    const parameters = new Array();
    // insert sql
    let insertSql = `INSERT INTO ${metadata.getTableName()} (`;
    let questionMarkParams = ``;
    // insert fields
    metadata.getInsertableFields().forEach((field) => {
      insertSql += `${field},`;
      questionMarkParams += `?,`;
      parameters.push(entity[field]);
    });
    // remove last comma
    insertSql = insertSql.substring(0, insertSql.lastIndexOf(','));
    questionMarkParams = questionMarkParams.substring(0, questionMarkParams.lastIndexOf(','));
    insertSql += `) VALUES ( ${questionMarkParams} )`;

    if (conn) {
      return new Promise<number>(async (success, failure) => {
        conn.query(insertSql, parameters, (err, rows) => {
          if (err) {
            this.log(err);
            failure(err);
          }
          this.logResults(insertSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(insertSql, parameters, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(insertSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public delete<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
    const parameters = new Array();
    // delete sql
    let deleteSql = `DELETE FROM ${metadata.getTableName()} `;
    deleteSql += ` WHERE ${metadata.getIdField()} = ?`;
    parameters.push(entity[metadata.getIdField()]);

    if (conn) {
      return new Promise<number>(async (success, failure) => {
        conn.query(deleteSql, parameters, (err, rows) => {
          if (err) {
            this.log(err);
            failure(err);
          }
          this.logResults(deleteSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().query(deleteSql, parameters, (err, rows) => {
        if (err) {
          this.log(err);
          failure(err);
        }
        this.logResults(deleteSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public async executeTransaction(transactions: Queue<DBTransaction>): Promise<number> {
    return new Promise<number>(async (success, failure) => {
      this.getConnectionPool().getConnection((err: MysqlError, connection: PoolConnection) => {
        if (err) {
          this.log(err);
          connection.release();
        }
        connection.beginTransaction(async (err1: MysqlError) => {
          if (err1) {
            this.log(err1);
            connection.release();
          }
          while (transactions.size() > 0) {
            const transaction = transactions.dequeue();
            switch (transaction?.transactionType) {
              case DBTransactionType.Add:
                await this.add(transaction.pojoMetadata, transaction.entity, connection);
                break;
              case DBTransactionType.Update:
                await this.update(transaction.pojoMetadata, transaction.entity, connection);
                break;
              case DBTransactionType.Delete:
                await this.delete(transaction.pojoMetadata, transaction.entity, connection);
                break;
              default:
                break;
            }
          }
        });
        connection.commit((err2: MysqlError) => {
          if (err2) {
            this.log(err2);
            connection.rollback();
            failure(err2);
          }
          connection.release();
        });
        return success(1);
      });
    });
  }
}
