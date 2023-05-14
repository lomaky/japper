/* eslint-disable @typescript-eslint/naming-convention */
import { Connection, MysqlError, PoolConnection } from 'mysql';
import { DBTransactionType } from './db-transaction-type';
import { DBTransaction } from './db-transaction';
import { PojoMetadata } from './pojo-metadata';
import { DBMysql } from './db-mysql';
import { Queue } from './queue';

export class Japper {
  public static getListPagedQuery(
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

  public static query<T>(sql: string, parameters: Map<string, any>): Promise<T[]> {
    return new Promise<T[]>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(sql, [...parameters.values()], (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(sql, parameters, rows);
        return success(rows as T[]);
      });
    });
  }

  public static queryExecute(sql: string, parameters: Map<string, any>): Promise<number> {
    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(sql, parameters, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(sql, null, rows);
        return success(rows as number);
      });
    });
  }

  public static getQueryCount<T>(sql: string, parameters: Map<string, any>): Promise<number> {
    const query = 'SELECT COUNT(1) as entityCount ' + sql.substring(sql.indexOf('FROM'));
    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0].entityCount as number);
      });
    });
  }

  public static getEntitiesCount<T>(metadata: PojoMetadata, parameters: Map<string, any>): Promise<number> {
    let query = 'SELECT COUNT(1) as entityCount FROM ' + metadata.getTableName() + ' WHERE 1 = 1 ';
    parameters.forEach((value: object, key: string) => {
      query += ' AND ' + key + ' = ?';
    });
    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0].entityCount as number);
      });
    });
  }

  public static getEntityById<T>(metadata: PojoMetadata, entityId: number, userId: number | undefined): Promise<T> {
    let query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE ID = ? ';
    if (userId) {
      query += ' AND USER_ID = ?';
    }
    const parameters = new Map([
      ['ID', entityId],
      ['USER_ID', userId],
    ]);

    return new Promise<T>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows[0] as T);
      });
    });
  }

  public static getEntities<T>(metadata: PojoMetadata, parameters: Map<string, any>): Promise<T[]> {
    let query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE 1 = 1 ';
    parameters.forEach((value: object, key: string) => {
      query += ' AND ' + key + ' = ?';
    });

    return new Promise<T[]>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, [...parameters.values()], (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, parameters, rows);
        return success(rows as T[]);
      });
    });
  }

  public static getIdListForQuery(ids: number[]): string {
    let idListStr = ' (';
    ids.forEach((id: number) => {
      idListStr += id + ',';
    });
    idListStr += ' -100) ';
    return idListStr;
  }

  public static getEntitiesByReferenceIds<T>(
    metadata: PojoMetadata,
    referenceIdName: string,
    ids: number[],
  ): Promise<T[]> {
    const query =
      'SELECT * FROM ' + metadata.getTableName() + ' WHERE ' + referenceIdName + ' IN ' + this.getIdListForQuery(ids);

    return new Promise<T[]>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, null, rows);
        return success(rows as T[]);
      });
    });
  }

  public static getEntitiesByIds<T>(metadata: PojoMetadata, ids: number[]): Promise<T[]> {
    const query = 'SELECT * FROM ' + metadata.getTableName() + ' WHERE ID IN ' + this.getIdListForQuery(ids);

    return new Promise<T[]>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(query, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(query, null, rows);
        return success(rows as T[]);
      });
    });
  }

  public static logResults(query: string, parameters: Map<string, any> | null, rows: any): void {
    console.log('query: ' + query);
    if (parameters) {
      console.log('parameters:' + [...parameters.values()]);
    }
    if (rows && rows.length) {
      console.log('results:' + rows.length);
    }
  }

  public static update<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
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
            console.log(err);
            failure(err);
          }
          this.logResults(updateSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(updateSql, parameters, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(updateSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public static add<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
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
            console.log(err);
            failure(err);
          }
          this.logResults(insertSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(insertSql, parameters, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(insertSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public static delete<T>(metadata: PojoMetadata, entity: any, conn: Connection | null = null): Promise<number> {
    const parameters = new Array();
    // delete sql
    let deleteSql = `DELETE FROM ${metadata.getTableName()} `;
    deleteSql += ` WHERE ${metadata.getIdField()} = ?`;
    parameters.push(entity[metadata.getIdField()]);

    if (conn) {
      return new Promise<number>(async (success, failure) => {
        conn.query(deleteSql, parameters, (err, rows) => {
          if (err) {
            console.log(err);
            failure(err);
          }
          this.logResults(deleteSql, null, rows);
          return success(rows as number);
        });
      });
    }

    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(deleteSql, parameters, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        this.logResults(deleteSql, null, rows);
        return success(rows as number);
      });
    });
  }

  public static async executeTransaction(transactions: Queue<DBTransaction>): Promise<number> {
    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().getConnection((err: MysqlError, connection: PoolConnection) => {
        if (err) {
          console.log(err);
          connection.release();
        }
        connection.beginTransaction(async (err1: MysqlError) => {
          if (err1) {
            console.log(err1);
            connection.release();
          }
          while (transactions.size() > 0) {
            const transaction = transactions.dequeue();
            switch (transaction?.transactionType) {
              case DBTransactionType.Add:
                await Japper.add(transaction.pojoMetadata, transaction.entity, connection);
                break;
              case DBTransactionType.Update:
                await Japper.update(transaction.pojoMetadata, transaction.entity, connection);
                break;
              case DBTransactionType.Delete:
                await Japper.delete(transaction.pojoMetadata, transaction.entity, connection);
                break;
              default:
                break;
            }
          }
        });
        connection.commit((err2: MysqlError) => {
          if (err2) {
            console.log(err2);
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
