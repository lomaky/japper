/* eslint-disable @typescript-eslint/naming-convention */
import { Connection, MysqlError, PoolConnection, createPool, Pool, PoolConfig } from 'mysql';
import { JapperConfig } from './japper-config';
import { Japper } from './japper';
import { SEQUENCE_DATA, SEQUENCE_DATAMetadata } from './sequence-data';
import { readFileSync } from 'fs';
import path from 'path';
const readline = require('readline');

export class JapperSetup {  
  
  private _japper:Japper;
  private _japperConfig:JapperConfig;

  public constructor(config: JapperConfig){
    this._japperConfig = config;
    this._japper = new Japper(config);
  }

  async isSequenceSetup(): Promise<boolean>{
    const query = 'SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?';
    const count = await this._japper.getQueryCount(query,
      new Map([
        ['TABLE_NAME', new SEQUENCE_DATAMetadata().getTableName()],
        ['TABLE_SCHEMA', this._japperConfig.schema]
      ])
    )
    return count > 0;
  }

  async createSequence(): Promise<void>{
    // Create SEQUENCE_DATA Table
    const sequenceScript = readFileSync(path.resolve(__dirname, './sql-scripts/sequence_table.sql'), 'utf-8');
    console.log('Creating SEQUENCE_DATA table...');
    await this._japper.queryExecute(sequenceScript, new Map([]));
    console.log('SEQUENCE_DATA table created.');
    // Insert ID_SEQ
    const idSeq: SEQUENCE_DATA = {
      sequence_name: 'ID_SEQ',
      sequence_increment: 99,
      sequence_min_value: 999,
      sequence_max_value: 999999999999999999999999999,
      sequence_cur_value: 999,
      sequence_cycle: 0
    }
    await this._japper.add(new SEQUENCE_DATAMetadata(), idSeq);

    // // Create Sequence functions: log_bin_trust_function_creators
    try {
      const log_bin_trust_function_creators = 'SET GLOBAL log_bin_trust_function_creators = 1'
      console.log('SET GLOBAL log_bin_trust_function_creators = 1');
      await this._japper.queryExecute(log_bin_trust_function_creators, new Map([]));
    } catch {}
    // Create Sequence functions: currval
    const currval = readFileSync(path.resolve(__dirname, './sql-scripts/currval.sql'), 'utf-8');
    console.log('Creating currval function...');
    await this._japper.queryExecute(currval, new Map([]));
    console.log('currval function created.');
    // Create Sequence functions: nextval
    const nextval = readFileSync(path.resolve(__dirname, './sql-scripts/nextval.sql'), 'utf-8');
    console.log('Creating nextval function...');
    await this._japper.queryExecute(nextval, new Map([]));
    console.log('nextval function created.');
    // Create Sequence functions: setval
    const setval = readFileSync(path.resolve(__dirname, './sql-scripts/setval.sql'), 'utf-8');
    console.log('Creating setval function...');
    await this._japper.queryExecute(setval, new Map([]));
    console.log('setval function created.');        
  }

  async setupDb(){
    if ( !(await this.isSequenceSetup())){
      // Create table and functions
      await this.createSequence();
    }
  }

}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


function input(prompt:string):Promise<string> {
    return new Promise((callbackFn, errorFn) => {
        rl.question(prompt, (uinput:string)=> {
            callbackFn(uinput);
        }, ()=> {
            errorFn();
        });
    });
}
const main = async () => {
  let japperConfig: JapperConfig = {
    host: '',
    schema: '',
    username: '',
    password: '',
    port: 3306,
    verbose: false
  }
  console.log('Please provide MySql credentials to set up database and create pojos');  
  japperConfig.host = await input("Host (example: 127.0.0.1): ");
  japperConfig.schema = await input("Schema (example: myDb): ");
  japperConfig.username = await input("Username (example: myDbUser): ");
  japperConfig.password = await input("Password (example: myDbPwd): ");
  japperConfig.port = +(await input("Port (example: 3306): "));
  const japperSetup = new JapperSetup(japperConfig);
  await japperSetup.setupDb();
  console.log('Database sequence created and pojos generated. CTRL-C to exit.');  
  rl.close();
};

main();
