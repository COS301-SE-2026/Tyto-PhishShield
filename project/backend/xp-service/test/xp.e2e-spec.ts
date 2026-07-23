/**
 * Service: xp-service
 *
 * End-to-end integration tests for giving xp operations.
 * Boots the full NestJS application and runs requests against a live database.
 *
 * Tests:
 * - POST /xp - Awards a user xp. It includes the users auth0Id, the amount of xp, and an optional field for the reason for the xp.
 * - GET /xp - Retrieves all xp entries recorded in the xp database.
 * - GET /xp/net - Retrieves aggregated net XP totals for all users (leaderboard).
 * - GET /xp/:auth0Id - Fetches all individual XP records for a specific user.
 * - GET /xp/:auth0Id/net - Fetches the total (net) XP accumulated by a specific user.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Response } from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { UserEntity } from '../src/entities/user.entity';
import { XpEntity } from '../src/entities/xp.entity';

const TEST_AUTH0_ID = 'test-auth0-id-xp-e2e';

describe('XP service integration test', () => {
  let app: INestApplication;
  let userRepository: Repository<UserEntity>;
  let xpRepository: Repository<XpEntity>;
  let seededUser: UserEntity | null;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    userRepository = app.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    xpRepository = app.get<Repository<XpEntity>>(getRepositoryToken(XpEntity));

    seededUser = await userRepository.findOneBy({ auth0Id: TEST_AUTH0_ID });

    if (!seededUser) {
      const newUser = userRepository.create({
        id: '550e8400-e29b-41d4-a716-446655440000',
        auth0Id: TEST_AUTH0_ID,
        name: 'XP E2E Tester',
        email: 'xp-e2e@example.com',
        department: 'Test Department',
      });
      seededUser = await userRepository.save(newUser);
      console.log('Successfully seeded user:', JSON.stringify(seededUser));
    }
  }, 30000);

  afterAll(async () => {
    if (seededUser) {
      await xpRepository.delete({ userId: seededUser.id });
      await userRepository.remove(seededUser);
    }
    await app.close();
  });

  it('/xp (POST) - should award XP to a user', () => {
    return request(app.getHttpServer() as Server)
      .post('/xp')
      .send({
        auth0Id: TEST_AUTH0_ID,
        amount: 250,
        reason: 'E2E Testing completion',
      })
      .expect(201)
      .expect((res: Response) => {
        const body = res.body as XpEntity;
        console.log('POST /xp BODY:', JSON.stringify(body));
        expect(body.id).toBeDefined();
        expect(body.amount).toEqual(250);
        expect(body.reason).toEqual('E2E Testing completion');
        expect(body.userId).toBeDefined();
      });
  });

  it('/xp (GET) - should retrieve all XP records', () => {
    return request(app.getHttpServer() as Server)
      .get('/xp')
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as XpEntity[];
        console.log('GET /xp BODY:', JSON.stringify(body));
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
      });
  });

  it('/xp/net (GET) - should retrieve net XP for all users', () => {
    return request(app.getHttpServer() as Server)
      .get('/xp/net')
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { auth0Id: string; totalXp: number }[];
        console.log('GET /xp/net BODY:', JSON.stringify(body));
        expect(Array.isArray(body)).toBe(true);
        if (body.length > 0) {
          expect(body[0]?.auth0Id).toBeDefined();
          expect(typeof body[0]?.totalXp).toBe('number');
        }
      });
  });

  it('/xp/:auth0Id (GET) - should fetch specific user XP records', () => {
    return request(app.getHttpServer() as Server)
      .get(`/xp/${TEST_AUTH0_ID}`)
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as XpEntity[];
        console.log(`GET /xp/${TEST_AUTH0_ID} BODY:`, JSON.stringify(body));
        expect(Array.isArray(body)).toBe(true);
      });
  });

  it('/xp/:auth0Id/net (GET) - should fetch net XP for a specific user', () => {
    return request(app.getHttpServer() as Server)
      .get(`/xp/${TEST_AUTH0_ID}/net`)
      .expect(200)
      .expect((res: Response) => {
        const body = res.body as { auth0Id: string; totalXp: number };
        console.log(`GET /xp/${TEST_AUTH0_ID}/net BODY:`, JSON.stringify(body));
        expect(body.auth0Id).toEqual(TEST_AUTH0_ID);
        expect(typeof body.totalXp).toBe('number');
        expect(body.totalXp).toBeGreaterThanOrEqual(250);
      });
  });
});
