import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WaveEntity } from '../entities/wave.entity';
import { WaveRecipientEntity } from '../entities/wave-recipient.entity';
import { WaveDto } from '../dto/wave.dto';
import { WaveMinimumDto } from '../dto/wave-minimum.dto';
import { WaveRecipientDto } from '../dto/wave-recipient.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class WaveService {
  private readonly logger = new Logger(WaveService.name);

  constructor(
    @InjectRepository(WaveEntity)
    private readonly waveRepository: Repository<WaveEntity>,
    @InjectRepository(WaveRecipientEntity)
    private readonly waveRecipientRepository: Repository<WaveRecipientEntity>,
    private readonly ampqConnection: AmqpConnection,
  ) {}

  async saveWave(body: WaveDto): Promise<WaveEntity> {
    const wave = this.waveRepository.create({
      waveName: body.waveName,
      scheduledFrom: new Date(body.scheduledFrom),
      scheduledTo: new Date(body.scheduledTo),
      sameEmail: body.sameEmail,
      randomisedTimes: body.randomisedTimes,
      recipients: this.createWaveRecipients(body.recipients),
    });

    let savedWave: WaveEntity;

    try {
      savedWave = await this.waveRepository.save(wave);
    } catch (error) {
      this.logger.error(`Failed to save wave record "${body.waveName}"`, error);
      throw error;
    }

    await this.ampqConnection.publish('wave-event-exchange', 'wave.create', {
      waveId: savedWave.id,
      waveName: savedWave.waveName,
      scheduledFrom: savedWave.scheduledFrom.toISOString(),
      scheduledTo: savedWave.scheduledTo.toISOString(),
      sameEmail: savedWave.sameEmail,
      randomisedTimes: savedWave.randomisedTimes,
      numberOfRecipients: savedWave.recipients?.length ?? 0,
    });

    return savedWave;
  }

  private createWaveRecipients(
    recipients: WaveRecipientDto[],
  ): WaveRecipientEntity[] {
    return recipients.map((recipient) =>
      this.waveRecipientRepository.create({
        auth0Id: recipient.auth0Id,
        referenceNumber: recipient.referenceNumber,
        emailId: recipient.emailId,
        scheduledAt: recipient.scheduledAt,
      }),
    );
  }

  async getWaveWithId(id: string): Promise<WaveEntity> {
    const wave = await this.waveRepository.findOne({
      where: { id },
      relations: ['recipients'],
    });

    if (!wave) {
      throw new NotFoundException(`Wave not found for id: ${id}`);
    }

    return wave;
  }

  async getWavesWithAuth0Id(auth0Id: string): Promise<WaveEntity[]> {
    const rows = await this.waveRepository
      .createQueryBuilder('wave')
      .innerJoin('wave.recipients', 'recipient')
      .where('recipient.auth0Id = :auth0Id', { auth0Id })
      .select('wave.id', 'waveId')
      .distinct(true)
      .getRawMany<{ waveId: string }>();

    if (rows.length === 0) {
      return [];
    }

    return this.waveRepository.find({
      where: { id: In(rows.map((row) => row.waveId)) },
      relations: ['recipients'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllNames(): Promise<string[]> {
    const waves = await this.waveRepository.find({ select: ['waveName'] });
    return waves.map((wave) => wave.waveName);
  }

  async getWaves(): Promise<WaveEntity[]> {
    return this.waveRepository.find({
      relations: ['recipients'],
      order: { createdAt: 'DESC' },
    });
  }

  async getWavesMinimum(): Promise<WaveMinimumDto[]> {
    const waves = await this.waveRepository.find({
      order: { createdAt: 'DESC' },
    });

    const recipients = await this.getRecipientCount();

    return waves.map((wave) => ({
      waveName: wave.waveName,
      scheduledFrom: wave.scheduledFrom.toISOString(),
      scheduledTo: wave.scheduledTo.toISOString(),
      sameEmail: wave.sameEmail,
      randomisedTimes: wave.randomisedTimes,
      numberOfRecipients: recipients.get(wave.id) || 0,
    }));
  }

  private async getRecipientCount(): Promise<Map<string, number>> {
    const rows = await this.waveRecipientRepository
      .createQueryBuilder('recipient')
      .innerJoin('recipient.wave', 'wave')
      .select('wave.id', 'waveId')
      .addSelect('COUNT(recipient.id)', 'count')
      .groupBy('wave.id')
      .getRawMany<{ waveId: string; count: string }>();

    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.waveId, Number(row.count));
    }
    return counts;
  }

  async deleteWave(id: string): Promise<void> {
    const wave = await this.waveRepository.findOne({
      where: { id },
    });

    const result = await this.waveRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Wave not found for id: ${id}`);
    }

    await this.ampqConnection.publish('wave-event-exchange', 'wave.delete', {
      waveId: wave.id,
    });
  }
}
