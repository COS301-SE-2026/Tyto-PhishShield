import { API_BASE, authFetch } from './api';
import type { Period } from '../pages/analytics/analytics.service';

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