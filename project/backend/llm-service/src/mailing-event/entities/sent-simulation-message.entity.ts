import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SentMessageKind {
  TEMPLATE = 'template',
  SPEAR_PHISHING = 'spear_phishing',
  GENERATED_REPLY = 'generated_reply',
}

@Entity()
export class SentSimulationMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  emailId: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column()
  recipientAuth0Id: string;

  @Column({ type: 'enum', enum: SentMessageKind })
  kind: SentMessageKind;

  @CreateDateColumn()
  sentAt: Date;
}
