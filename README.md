# japper-mysql

<span class="badge-npmversion"><a href="https://www.npmjs.com/package/japper-mysql" title="View this project on NPM"><img src="https://img.shields.io/npm/v/japper.svg" alt="NPM version" /></a></span>

Who wants to write basic read/insert/update/delete statements? 

A simple object mapper and CRUD helper for Mysql/Nodejs on top of [mysql](https://www.npmjs.com/package/mysql) built with typescript, heavily inspired by [Dapper](https://github.com/DapperLib/Dapper) and [Dapper.SimpleCRUD](https://github.com/ericdc1/Dapper.SimpleCRUD).

## Features

- TODO
- 

## Usage

#### Example

```typescript
import { Japper } from "japper-mysql";
import { JapperConfig } from "japper-mysql/lib/japper-config";

const main = async () => {  
  const config: JapperConfig = {
    host: '127.0.0.1',
    schema: 'db',
    username: 'usr',
    password: 'pwd',
    port: 3306,
    verbose: false,
  };  
  const japper = new Japper(config);
  
  const users = await japper.getEntities<User>(
    new UserMetadata(), 
    new Map([['deleted', 0]])
  );
  users.forEach(u => console.log(u.email));
};
```
Output:
```bash
email1@email.com
email3@email.com
email2@email.com
```

## Installation

```bash
npm install japper-mysql
```

#### Configuring your database

japper-mysql needs the following scripts (included in the npm package) in the db to create the POJOs
- [pojogen](https://github.com/lomaky/japper/blob/main/src/sql-scripts/pojogen.sql)
- [pojoviewgen](https://github.com/lomaky/japper/blob/main/src/sql-scripts/pojoviewgen.sql)

Run the following command to add the sql scripts to the database.


```bash
node node_modules/japper-mysql/lib/japper-setup.js
```
Enter db credentials as well as path for POJOs
```bash
Please provide MySql credentials to set up database and create pojos
Host (example: 127.0.0.1): 
Schema (example: mySchema): 
Username (example: myDbUser): 
Password (example: myDbPwd): 
Port (example: 3306): 
Folder for table pojos (example: /MyProject/tables): 
Folder for view pojos (example: /MyProject/view): 
```

The script will also create a simulated numeric sequence as mysql does not support sequences. The sequence simulate Oracle sequences. The scripts for the sequence are the following:
- [sequence_table](https://github.com/lomaky/japper/blob/main/src/sql-scripts/sequence_table.sql) 
- [currval](https://github.com/lomaky/japper/blob/main/src/sql-scripts/currval.sql)
- [nextval](https://github.com/lomaky/japper/blob/main/src/sql-scripts/nextval.sql)
- [setval](https://github.com/lomaky/japper/blob/main/src/sql-scripts/setval.sql)


## Support

japper-mysql is free software. If you encounter a bug with the library please open an issue on the [GitHub repo](https://github.com/lomaky/japper).

When you open an issue please provide:

- version of node
- version of mysql
- smallest possible snippet of code to reproduce the problem

### Limitations

1. Tables must have primary key. No support for multi key.

### License

Copyright (c) 2023 Oscar Galvis (lomaky@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.