/* eslint-disable @typescript-eslint/no-unsafe-argument */
// TODO add fix eslint problem

/**
 * Service: waves-service
 *
 * End-to-end integration tests for wave operations.
 * Boots the full NestJS application and runs requests against a live database.
 *
 * Tests:
 * - POST /wave - Creates a new wave with associated recipients.
 * - GET /wave/names - Retrieves an array of all wave names.
 * - GET /wave/minimum - Retrieves a lightweight summary of all waves including recipient counts.
 * - GET /wave/user/:auth0Id - Retrieves all waves associated with a specific user.
 * - GET /wave - Retrieves all waves with full recipient details.
 * - GET /wave/:id - Retrieves a specific wave by its UUID; tests 404 for unknown UUID.
 * - DELETE /wave/:id - Deletes a specific wave by its UUID; tests 404 for unknown UUID.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { WaveEntity } from '../src/entities/wave.entity';
import { WaveMinimumDto } from '../src/dto/wave-minimum.dto';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

describe('Wave service integration tests', () => {
  let app: INestApplication;
  let testWaveId: string;
  let waveRepository: Repository<WaveEntity>;

  const TEST_AUTH0_ID = 'auth0|1';
  const TEST_WAVE_NAME = `E2E Wave`;
  const FAKE_UUID = '00000000-0000-0000-0000-000000000000';

  const wavePayload = {
    waveName: TEST_WAVE_NAME,
    scheduledFrom: new Date().toISOString(),
    scheduledTo: new Date().toISOString(),
    sameEmail: true,
    randomisedTimes: false,
    recipients: [
      {
        auth0Id: TEST_AUTH0_ID,
        referenceNumber: 'PHISH-WAVE-1',
        emailId: 'resend-id-1',
        scheduledAt: new Date().toISOString(),
      },
      {
        auth0Id: 'auth0|2',
        referenceNumber: 'PHISH-WAVE-2',
        emailId: 'resend-id-2',
        scheduledAt: new Date().toISOString(),
      },
    ],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    waveRepository = moduleFixture.get<Repository<WaveEntity>>(
      getRepositoryToken(WaveEntity),
    );

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (testWaveId) {
      await waveRepository.delete(testWaveId);
    }

    const amqpConnection = app.get(AmqpConnection);
    if (amqpConnection) {
      await amqpConnection.managedConnection.close();
    }

    await app.close();
  });

  it('/wave (POST) - should create a new wave and return the wave entity', () => {
    return request(app.getHttpServer())
      .post('/wave')
      .send(wavePayload)
      .expect(201)
      .expect((res: Response) => {
        const body = res.body as WaveEntity;
        expect(body.id).toBeDefined();
        expect(body.waveName).toBe(TEST_WAVE_NAME);
        expect(body.recipients).toHaveLength(2);

        testWaveId = body.id;
      });
  });

  it('/wave/names (GET) - should return an array of wave names', () => {
    return request(app.getHttpServer())
      .get('/wave/names')
      .expect(200)
      .expect((res: Response) => {
        const names = res.body as string[];
        expect(Array.isArray(names)).toBe(true);
        expect(names).toContain(TEST_WAVE_NAME);
      });
  });

  it('/wave/minimum (GET) - should return wave info without recipient info but with recipient count', () => {
    return request(app.getHttpServer())
      .get('/wave/minimum')
      .expect(200)
      .expect((res: Response) => {
        const waves = res.body as WaveMinimumDto[];
        const targetWave = waves.find((w) => w.waveName === TEST_WAVE_NAME);

        expect(targetWave).toBeDefined();
        expect(targetWave?.numberOfRecipients).toBe(2);
        expect(targetWave?.sameEmail).toBe(true);
      });
  });

  it('/wave/user/:auth0Id (GET) - should return waves for specific user', () => {
    return request(app.getHttpServer())
      .get(`/wave/user/${TEST_AUTH0_ID}`)
      .expect(200)
      .expect((res: Response) => {
        const waves = res.body as WaveEntity[];
        expect(waves.length).toBeGreaterThan(0);

        const targetWave = waves.find((w) => w.id === testWaveId);
        expect(targetWave).toBeDefined();
        expect(targetWave?.waveName).toBe(TEST_WAVE_NAME);
      });
  });

  it('/wave (GET) - should return all waves with relations', () => {
    return request(app.getHttpServer())
      .get('/wave')
      .expect(200)
      .expect((res: Response) => {
        const waves = res.body as WaveEntity[];
        const targetWave = waves.find((w) => w.id === testWaveId);

        expect(targetWave).toBeDefined();
        expect(targetWave?.recipients.length).toBe(2);
      });
  });

  it('/wave/:id (GET) - should return a specific wave by id', () => {
    return request(app.getHttpServer())
      .get(`/wave/${testWaveId}`)
      .expect(200)
      .expect((res: Response) => {
        const wave = res.body as WaveEntity;
        expect(wave.id).toBe(testWaveId);
        expect(wave.waveName).toBe(TEST_WAVE_NAME);
      });
  });

  it('/wave/:id (GET) - should return 404 if wave id does not exist', () => {
    return request(app.getHttpServer()).get(`/wave/${FAKE_UUID}`).expect(404);
  });

  it('/wave/:id (DELETE) - should delete the specified wave and return 204 No Content', () => {
    return request(app.getHttpServer())
      .delete(`/wave/${testWaveId}`)
      .expect(204);
  });

  it('/wave/:id (DELETE) - should return 404 when trying to delete a non-existent wave', () => {
    return request(app.getHttpServer())
      .delete(`/wave/${testWaveId}`)
      .expect(404);
  });
});
