import { handleXPResponse } from './dashboard.service';
import { XPResponse } from '../../types/index';

describe('Handle XP', () => {
  it('Error XP', () => {
    const xp: XPResponse = {
        status: "Error",
        message: "Some thing",
        xp: 10,
        userId: "123",
    }
    expect(handleXPResponse(xp)).toBe(0);
  });

  it('Success XP', () => {
    const xp: XPResponse = {
        status: "Success",
        message: "Some thing",
        xp: 10,
        userId: "123",
    }
    expect(handleXPResponse(xp)).toBe(10);
  });
});