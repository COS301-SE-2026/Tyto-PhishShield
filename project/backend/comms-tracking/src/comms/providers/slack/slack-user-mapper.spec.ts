/**
 * Unit tests for SlackUserMapper.
 *
 * Covers the three-stage lookup (memory cache → DB → Slack API),
 * thread parent lookup, and error handling.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { SlackUserMapper } from './slack-user-mapper';
import { CommsUser } from '../../entities/comms-user.entity';

const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockClient = {
  users: { info: jest.fn() },
  conversations: { replies: jest.fn() },
} as any;

describe('SlackUserMapper', () => {
  let mapper: SlackUserMapper;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackUserMapper,
        { provide: getRepositoryToken(CommsUser), useValue: mockUserRepo },
      ],
    }).compile();

    mapper = module.get(SlackUserMapper);
  });

  describe('toAuth0Id', () => {
    it('returns the auth0Id from the in-memory cache on the second call', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        auth0Id: 'auth0|alice',
        slackId: 'U123',
      } as any);

      const first = await mapper.toAuth0Id('U123', mockClient);
      const second = await mapper.toAuth0Id('U123', mockClient);

      expect(first).toBe('auth0|alice');
      expect(second).toBe('auth0|alice');
      // Only one DB roundtrip even though we called twice
      expect(mockUserRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockClient.users.info).not.toHaveBeenCalled();
    });

    it('resolves via Slack users.info when not yet mapped, and persists the mapping', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null) // by slackId
        .mockResolvedValueOnce({
          auth0Id: 'auth0|bob',
          email: 'bob@example.com',
        } as any); // by email
      mockClient.users.info.mockResolvedValue({
        user: { profile: { email: 'bob@example.com' } },
      });
      mockUserRepo.save.mockResolvedValue({} as any);

      const result = await mapper.toAuth0Id('U456', mockClient);

      expect(result).toBe('auth0|bob');
      expect(mockClient.users.info).toHaveBeenCalledWith({ user: 'U456' });
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          auth0Id: 'auth0|bob',
          slackId: 'U456',
        }),
      );
    });

    it('returns null when the Slack user has no email in their profile', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockClient.users.info.mockResolvedValue({ user: { profile: {} } });

      const result = await mapper.toAuth0Id('U789', mockClient);

      expect(result).toBeNull();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('returns null when no local user matches the email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockClient.users.info.mockResolvedValue({
        user: { profile: { email: 'ghost@example.com' } },
      });

      const result = await mapper.toAuth0Id('U789', mockClient);

      expect(result).toBeNull();
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('returns null when the Slack API call throws', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockClient.users.info.mockRejectedValue(new Error('rate limited'));
      const logSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      const result = await mapper.toAuth0Id('U999', mockClient);

      expect(result).toBeNull();
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('getThreadParentAuthor', () => {
    it('returns the parent message author', async () => {
      mockClient.conversations.replies.mockResolvedValue({
        messages: [{ user: 'U123' }],
      });

      const result = await mapper.getThreadParentAuthor(
        'C1',
        '1700.100',
        mockClient,
      );

      expect(result).toBe('U123');
      expect(mockClient.conversations.replies).toHaveBeenCalledWith({
        channel: 'C1',
        ts: '1700.100',
        limit: 1,
      });
    });

    it('returns null when Slack returns no messages', async () => {
      mockClient.conversations.replies.mockResolvedValue({ messages: [] });

      const result = await mapper.getThreadParentAuthor(
        'C1',
        '1700.100',
        mockClient,
      );

      expect(result).toBeNull();
    });

    it('returns null when the API call fails', async () => {
      mockClient.conversations.replies.mockRejectedValue(new Error('nope'));
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {});

      const result = await mapper.getThreadParentAuthor(
        'C1',
        '1700.100',
        mockClient,
      );

      expect(result).toBeNull();
      warnSpy.mockRestore();
    });
  });
});
