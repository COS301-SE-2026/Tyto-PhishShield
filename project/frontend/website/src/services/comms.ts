import { API_BASE, authFetch } from './api';
import type { Period } from '../pages/analytics/analytics.service';

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

export interface CommsNode {
  id: string;
  label: string;
  department?: string;
}

export interface CommsEdge {
  source: string;
  target: string;
  weight: number;
  lastInteractionAt: string;
}

export interface CommsGraph {
  nodes: CommsNode[];
  edges: CommsEdge[];
}

export async function fetchCommsGraph(period: Period): Promise<CommsGraph> {
  const res = await authFetch(`${API_BASE}/comms/graph?period=${period}`);
  if (!res.ok) throw new Error(`Failed to load communications graph (${res.status})`);
  return res.json() as Promise<CommsGraph>;
}

export interface CommsMessage {
  id: string;
  source: 'slack' | 'teams' | 'email';
  senderAuth0Id: string;
  receiverAuth0Ids: string[];
  text: string;
  isReply: boolean;
  channelExternalId?: string | null;
  occurredAt: string;
}

export async function fetchCommsMessages(senderAuth0Id: string, receiverAuth0Id: string, period: Period, limit = 50): Promise<CommsMessage[]> {
  const params = new URLSearchParams({
    senderAuth0Id,
    receiverAuth0Id,
    sinceDays: String(PERIOD_DAYS[period]),
    limit: String(limit),
  });
  const res = await authFetch(`${API_BASE}/comms/messages?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
  return res.json() as Promise<CommsMessage[]>;
}