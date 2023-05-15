# japper-mysql

<span class="badge-npmversion"><a href="https://www.npmjs.com/package/japper-mysql" title="View this project on NPM"><img src="https://img.shields.io/npm/v/japper-mysql.svg" alt="japper-mysql version" /></a></span>

Who wants to write basic select/insert/update/delete statements?

A simple object mapper and CRUD helper for Mysql/Nodejs on top of [mysql](https://www.npmjs.com/package/mysql) built with typescript, inspired by [Dapper](https://github.com/DapperLib/Dapper) and [Dapper.SimpleCRUD](https://github.com/ericdc1/Dapper.SimpleCRUD).


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
const user = await japper.getEntityById<Users>(
  new UsersMetadata(), 1000
);
```

##### Create new db entity
Example: Create new user with sequential id
```typescript
const user:Users = {
  id: await japper.getId(),
  email: 'email1@email.com',
  name: 'Oscar',
  deleted: 0,
  created_date: new Date(),  
};
await japper.add(new UsersMetadata(), user);
```

##### Update db entity
Example: Update user email with Id = 1000
```typescript
const user = await japper.getEntityById<Users>(
  new UsersMetadata(), 1000
);
user.email = 'email2@email.com';
await japper.update(new UsersMetadata(), user);
```

##### Delete db entity
Example: Delete user with Id = 1000
```typescript
const user = await japper.getEntityById<Users>(
  new UsersMetadata(), 1197
);
await japper.delete(new UsersMetadata(), user);
```

##### Get multiple db entities
Example: Get all users not deleted and with name = Oscar
```typescript
const users = await japper.getEntities<Users>(
  new UsersMetadata(),
  new Map([
	['name', 'Oscar'],
	['deleted', '0'],
  ])
);
```
Example: Get all roles with id in the list
```typescript
const roleUsers = await japper.getEntitiesByIds<RoleUsers>(
    new RoleUsersMetadata(),
    [1100, 1200, 1300]
);
```
Example: Get all roles with user_id in list
```typescript
const roleUsers = await japper.getEntitiesByReferenceIds<RoleUsers>(
    new RoleUsersMetadata(),
    'user_id',
    users.map(({ id }) => id)
);
```
Example: Custom queries. 
```typescript
const sql = 'select * from Users where created_date < ? and name like ?';
const users = await japper.query<Users>(
    sql,
    new Map([
      ['created_date', new Date().toISOString()],
      ['name', '%Os%'],
    ])
);
```
##### Count
Example: Get count of all users with role_id 1098
```typescript
const count = await japper.getEntitiesCount<RoleUsers>(
  new RoleUsersMetadata(),
  new Map([
	['role_id', 1098],
	['deleted', 0],
  ])
);
```
##### Multiple database transactions
Example: Mark as deleted all inactive users and update realted groups updated date to now.
```typescript
  const japper = new Japper(config);
  const newRoleId= await japper.getId();
  const operations = new Queue<DBTransaction>();
  // Create new Role
  operations.enqueue(
    new DBTransaction(
        DBTransactionType.Add, 
        new RolesMetadata(),
        {
            id: newRoleId,
            name: 'Operators',
            deleted: 0
        }
    ));
  // Create new User
  const newUserId = await japper.getId();
  operations.enqueue(
    new DBTransaction(
        DBTransactionType.Add, 
        new UsersMetadata(),
        {
            id: newUserId, 
            name: 'Oscar',
            email: 'lomaky@gmail.com', 
            deleted: 0, 
            created_date: new Date()
        }
    ));
  // Add user to role
  operations.enqueue(
    new DBTransaction(
        DBTransactionType.Add, 
        new RoleUsersMetadata(),
        {
            id: await japper.getId(), 
            user_id: newUserId, 
            role_id: newRoleId,
            deleted: 0
        }
    ));
  await japper.executeTransaction(operations);
```

##### Updating or creating new Pojos
To create a new Pojo, create the table in the database 
```sql
CREATE TABLE `Roles` (
  `id` decimal(60,0) NOT NULL,
  `name` varchar(45) NOT NULL,
  `deleted` decimal(60,0) NOT NULL,
  PRIMARY KEY (`id`)
);
```
Then run the following script.
```sql
select pojogen('Roles');
```
or alternatively can be generated from typescript
```typescript
const japper = new Japper(config);
const pojo = await japper.getPojo('Users', false);
```
this will create the code for a new pojo that you can place in your typescript code
```typescript
/* eslint-disable @typescript-eslint/naming-convention */
import { PojoMetadata } from 'japper-mysql';
export interface Roles {
    id: number;
    name: string;
    deleted: string;
}

export class RolesMetadata implements PojoMetadata {
    constructor() {}

    getIdField(): string { return 'id'; }

    getTableName(): string { return 'Roles'; }

    getUpdatableFields(): string[] {
        return [
            'name',
            'deleted',
        ];
    }

    getInsertableFields(): string[] {
        return [
            'id',
            'name',
            'deleted',
        ];
    }
}
```

For views run the following script.
```sql
select pojoviewgen('userroleview');
```
this will create the code for a new pojo that you can place in your typescript code:
```typescript
/* eslint-disable @typescript-eslint/naming-convention */
import { PojoMetadata } from 'japper-mysql';
export interface userroleview {
    user_name: string;
    role_name: string;
}

export class userroleviewMetadata implements PojoMetadata {
    constructor() {}

    getIdField(): string { return ''; }

    getTableName(): string { return 'userroleview'; }

    getUpdatableFields(): string[] {
        return [
        ];
    }

    getInsertableFields(): string[] {
        return [
        ];
    }
}
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
2. No support for tables with reserved names (Group, User, etc...)

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