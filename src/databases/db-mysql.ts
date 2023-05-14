/* eslint-disable @typescript-eslint/naming-convention */
import { createPool, Pool, PoolConfig } from 'mysql';
import { Queue } from '../queue';

export class DBMysql {
  private static pool: Pool;

  private static instance: DBMysql;
  private static _maxNumberCachedIds: number = 500;
  private static _IDs = new Queue<number>();
  private static _sequenceId = 'ID_SEQ';
  private static _getIdentitySql = "SELECT nextval('" + DBMysql._sequenceId + "') as nextval";
  private conn: string = '';

  private constructor() {}

  public static async getInstance(): Promise<DBMysql> {
    if (!DBMysql.instance) {
      DBMysql.instance = new DBMysql();
      await DBMysql.instance.setup();
    }
    return DBMysql.instance;
  }

  public static async getId(): Promise<number> {
    if (DBMysql._IDs.size() < 10) {
      const seqId = await DBMysql.getNextSeqId();
      for (let i = 0; i < DBMysql._maxNumberCachedIds - 1; i++) {
        DBMysql._IDs.enqueue(seqId + i);
      }
    }
    const newId = DBMysql._IDs.dequeue();
    if (newId) {
      return newId;
    }
    throw new Error('Unable to obtain ID');
  }

  public static async getNextSeqId(): Promise<number> {
    console.log('query: ' + DBMysql._getIdentitySql);
    return new Promise<number>(async (success, failure) => {
      (await DBMysql.getInstance()).getConnectionPool().query(DBMysql._getIdentitySql, (err, rows) => {
        if (err) {
          console.log(err);
          failure(err);
        }
        return success(rows[0].nextval as number);
      });
    });
  }

  public getConnectionPool(): Pool {
    return DBMysql.pool;
  }

  private async getConn(): Promise<string> {
    if (this.conn) {
      return this.conn;
    }
    if (process.env.DB) {
      this.conn = process.env.DB;
    }
    return this.conn;
  }

  private async setup(): Promise<void> {
    if (!DBMysql.pool) {
      const connParts = Object.fromEntries((await this.getConn()).split(';').map((pair) => pair.split('=')));

      const dbConfigMySql = {
        host: connParts.Server,
        user: connParts.Uid,
        password: connParts.Pwd,
        database: connParts.Database,
        port: connParts.Port,
        connectionLimit: 15,
        queueLimit: 30,
        acquireTimeout: 1000000,
      } as PoolConfig;
      DBMysql.pool = createPool(dbConfigMySql);
    }
  }
}
