import test from 'ava'
import request from 'supertest'

test('math:add', async t => {
  t.plan(2);

  let hostUri = 'http://localhost:8182/'

  const res = await request(hostUri)
    .post('/api/add')
    .send({
      a: 1,
      b: 10
    });

  t.is(res.status, 200);
  t.is(res.body, '110');
});