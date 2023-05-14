/* eslint-disable @typescript-eslint/naming-convention */

import { JapperConfig } from './japper-config';
import { Japper } from './japper';
import { SEQUENCE_DATA, SEQUENCE_DATAMetadata } from './sequence-data';
import { readFileSync } from 'fs';
import path from 'path';
import { MYSQL_TABLE } from './mysql-table';
const readline = require('readline');
const fs = require('fs');
const url = require('url');

export class JapperSetup {  
  
  private _japper:Japper;
  private _japperConfig:JapperConfig;
  private _tablesPath:URL;
  private _viewsPath:URL;

  public constructor(config: JapperConfig, tablesPath:string, viewsPath:string){
    this._japperConfig = config;
    this._japper = new Japper(config);    
    if (!fs.existsSync(tablesPath)){
        fs.mkdirSync(tablesPath);
    }    
    if (!fs.existsSync(viewsPath)){
        fs.mkdirSync(viewsPath);
    }
    this._tablesPath = url.pathToFileURL(tablesPath) as URL;
    this._viewsPath = url.pathToFileURL(viewsPath) as URL;
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
      const logBinTrustFunctionCreators = 'SET GLOBAL log_bin_trust_function_creators = 1'
      console.log('SET GLOBAL log_bin_trust_function_creators = 1');
      await this._japper.queryExecute(logBinTrustFunctionCreators, new Map([]));
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
    // Create Sequence functions: pojogen
    const pojogen = readFileSync(path.resolve(__dirname, './sql-scripts/pojogen.sql'), 'utf-8');
    console.log('Creating pojogen function...');
    await this._japper.queryExecute(pojogen, new Map([]));
    console.log('pojogen function created.');
    // Create Sequence functions: pojoviewgen
    const pojoviewgen = readFileSync(path.resolve(__dirname, './sql-scripts/pojoviewgen.sql'), 'utf-8');
    console.log('Creating pojoviewgen function...');
    await this._japper.queryExecute(pojoviewgen, new Map([]));
    console.log('pojoviewgen function created.');         
  }

  async createPojos(): Promise<void>{    
    const sql =
        'select TABLE_NAME, TABLE_TYPE from information_schema.tables where table_schema = database();';
    const tables = await this._japper.query<MYSQL_TABLE>(
        sql,
        new Map([])
    );
    for (const table of tables.filter(table => table.TABLE_TYPE === 'BASE TABLE' || table.TABLE_TYPE === 'VIEW')) {        
        const isView = table.TABLE_TYPE === 'VIEW';
        const pojo = await this._japper.getPojo(table.TABLE_NAME, isView);
        if (pojo){
          console.log('Creating pojo for ' + table.TABLE_NAME);
          const filename = `${table.TABLE_NAME.replace(/_/g,'-').trim().toLowerCase()}.ts`;
          const tablePath = this._tablesPath.pathname + '/' + filename;
          const viewPath = this._viewsPath.pathname + '/' + filename;
          if (table.TABLE_TYPE === 'BASE TABLE') {
            fs.writeFileSync(tablePath, pojo, { flag: 'w+' });
          } else if (table.TABLE_TYPE === 'VIEW') {
            fs.writeFileSync(viewPath, pojo, { flag: 'w+' });
          }
        }else{
          console.log('Skipped pojo for ' + table.TABLE_NAME);
        }
    }
  }

  async setupDb(){
    if ( !(await this.isSequenceSetup())){
      // Create table and functions
      console.log('Setting DB up for first time');
      await this.createSequence();
    }else{
      console.log('DB set up for japper already.');
    }
    await this.createPojos();
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
  const japperConfig: JapperConfig = {
    host: '',
    schema: '',
    username: '',
    password: '',
    port: 3306,
    verbose: false
  }
  let tablesPath = '';
  let viewsPath = '';
  
  console.log('Please provide MySql credentials to set up database and create pojos');  
  japperConfig.host = await input("Host (example: 127.0.0.1): ");
  japperConfig.schema = await input("Schema (example: mySchema): ");
  japperConfig.username = await input("Username (example: myDbUser): ");
  japperConfig.password = await input("Password (example: myDbPwd): ");
  japperConfig.port = +(await input("Port (example: 3306): "));
  tablesPath = await input("Folder for table pojos (example: /MyProject/tables): ");
  viewsPath = await input("Folder for view pojos (example: /MyProject/view): ");
  const japperSetup = new JapperSetup(japperConfig, tablesPath, viewsPath);
  await japperSetup.setupDb();
  console.log('Database sequence created and pojos generated. CTRL-C to exit.');  
  rl.close();
};

main();
