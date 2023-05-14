import { Japper } from '../japper';

test('JapperQuery', async () => {
  const japper = new Japper({
    host: '127.0.0.1',
    schema: '',
    username: '',
    password: '',
    port: 3305,
    verbose: true,
  });
  expect(1).toBe(1);
});
