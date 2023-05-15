# japper-mysql

<span class="badge-npmversion"><a href="https://www.npmjs.com/package/japper-mysql" title="View this project on NPM"><img src="https://img.shields.io/npm/v/japper.svg" alt="NPM version" /></a></span>

Who wants to write basic select/insert/update/delete statements?

A simple object mapper and CRUD helper for Mysql/Nodejs on top of [mysql](https://www.npmjs.com/package/mysql) built with typescript, heavily inspired by [Dapper](https://github.com/DapperLib/Dapper) and [Dapper.SimpleCRUD](https://github.com/ericdc1/Dapper.SimpleCRUD).


## Usage

#### Initialization

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
};
```
##### Get db entity by Id
Example: Get user with Id = 1000
```typescript
const user = await japper.getEntityById<User>(
  new UserMetadata(), 1000
);
```

##### Create new db entity
Example: Create new user with sequential id
```typescript
const user:User = {
  id: await japper.getId(),
  email: 'email1@email.com',
  deleted: 0,
  active: 1,
  created_date: new Date()
};
await japper.add(new UserMetadata(), user);
```

##### Update db entity
Example: Update user email with Id = 1000
```typescript
const user = await japper.getEntityById<User>(
  new UserMetadata(), 1000
);
user.email = 'email2@email.com';
await japper.update(new UserMetadata(), user);
```

##### Delete db entity
Example: Delete user with Id = 1000
```typescript
const user = await japper.getEntityById<User>(
  new UserMetadata(), 1000
);
await japper.delete(new UserMetadata(), user);
```

##### Get multiple db entities
Example: Get all inactive and not deleted users
```typescript
const users = await japper.getEntities<User>(
  new UserMetadata(),
  new Map([
	['active', 0],
	['deleted', 1],
  ])
);
```
Example: Get all groups with users in the list
```typescript
const groups = await japper.getEntitiesByIds<Group>(
    new GroupMetadata(),
    users.map(({ group_id }) => group_id)
);
```
Example: Get all groups with role_id 1, 2 and 3
```typescript
const groups = await japper.getEntitiesByReferenceIds<Group>(
    new GroupMetadata(),
    'role_id',
    [1, 2, 3]
);
```
Example: Custom queries
```typescript
const sql = 'select * from User where created_date > ? and active = ?';
const users = await japper.query<User>(
    sql,
    new Map([
      ['created_date', new Date().toISOString()],
      ['active', '0'],
    ])
);
```
##### Count
Example: Get count of all inactive and not deleted users
```typescript
const count = await japper.getEntitiesCount<User>(
  new UserMetadata(),
  new Map([
	['active', 0],
	['deleted', 1],
  ])
);
```
##### Multiple database transactions
Example: Mark as deleted all inactive users and update realted groups updated date to now.
```typescript
const users = await japper.getEntities<User>(
  new UserMetadata(),
  new Map([['active', 0]])
);
const groups = await japper.getEntitiesByIds<Group>(
    new GroupMetadata(),
    users.map(({ group_id }) => group_id)
);
const operations = new Queue<DBTransaction>();
for (const group of groups) {
  group.updated = new Date();
  operations.enqueue(new DBTransaction(DBTransactionType.Update, new GroupMetadata(), group));  
}
for (const user of users) {
  user.deleted = 1;
  operations.enqueue(new DBTransaction(DBTransactionType.Update, new UserMetadata(), user));
}
await japper.executeTransaction(operations);
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