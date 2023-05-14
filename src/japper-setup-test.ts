import { JapperConfig } from './japper-config';
import { JapperSetup } from './japper-setup';

const main = async () => {
  // This is an example to run without interactive command line
  const japperConfig: JapperConfig = {
    host: '127.0.0.1',
    schema: 'mySchema',
    username: 'myUsername',
    password: 'myPwd',
    port: 3306,
    verbose: false,
  };
  const tablesPath = '/Users/user1/Temp/tables';
  const viewsPath = '/Users/user1/Temp/views';

  const japperSetup = new JapperSetup(japperConfig, tablesPath, viewsPath);
  await japperSetup.setupDb();
  console.log('Database sequence created and pojos generated. CTRL-C to exit.');
};

main();
