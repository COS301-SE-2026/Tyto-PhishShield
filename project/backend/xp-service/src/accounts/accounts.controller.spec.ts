import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { User } from '../dto/user.dto';

const mockAccountsService = {
  createUser: jest.fn(),
};

describe('AccountsController', () => {
  let controller: AccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [{ provide: AccountsService, useValue: mockAccountsService }],
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should delegate to accountsService.createUser with the user payload', async () => {
      const user: User = {
        id: 'user-1',
        auth0Id: 'auth0|123',
        name: 'test',
        email: 'test@example.com',
        department: 'Engineering',
      };
      mockAccountsService.createUser.mockResolvedValue(undefined);

      await controller.createUser(user);

      expect(mockAccountsService.createUser).toHaveBeenCalledWith(user);
    });

    it('should return void on success', async () => {
      mockAccountsService.createUser.mockResolvedValue(undefined);

      const result = await controller.createUser({
        id: 'user-1',
        auth0Id: 'auth0|123',
        name: 'test',
        email: 'test@example.com',
        department: 'Engineering',
      });

      expect(result).toBeUndefined();
    });
  });
});
