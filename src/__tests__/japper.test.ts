import { Queue } from "../queue";
test('Japper', () => {
  const queue = new Queue<number>();
  for (let index = 0; index < 10; index++) {
    queue.enqueue(index)
  }   
  expect( queue.size()).toBe(10);
});