/* Live XP updates for currently logged-in user (socket joins a room named after its own auth0Id)
  Hence there is no broadcast channel. Also, I think we require a `/socket.io/*` proxy rule pointed at api-gateway 
   or wherever this runs behind Caddy (not present currently in the Caddyfile) so the connection may fail until that's added.
 */
import { io, type Socket } from 'socket.io-client';
import { API_BASE, getToken } from './api';

// const GATEWAY_ORIGIN = String(import.meta.env.VITE_API_GATEWAY_URL ?? '');

async function getSocketTicket(): Promise<string> {
  const res = await fetch(`${API_BASE}/xp-websocket/ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to get websocket ticket');
  const { ticket } = await res.json() as { ticket: string };
  return ticket;
}

export async function connectXpSocket(): Promise<Socket> {
  const ticket = await getSocketTicket();
  return io(`${API_BASE}/xp-websocket`, { auth: { ticket } });
}
