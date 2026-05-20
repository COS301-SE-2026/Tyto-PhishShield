import { LoadXPController } from '../../services/load-xp';
import { XPResponse } from '../../types/index';

export async function getXP(): Promise<XPResponse> {
    const xp: XPResponse = await LoadXPController.getUserXp();
    xp.xp = handleXPResponse(xp);
    return xp;
}

export function handleXPResponse(xp: XPResponse): number {
    if (xp.status == "Error") {
        return 0;
    }
    return xp.xp;
}