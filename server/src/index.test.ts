import request from 'supertest';
import { app } from './index';

describe('GET /api/health', () => {
  it('returns 200 with status ok and a valid timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });
});
