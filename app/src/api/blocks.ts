import { api } from './client';
import type { Block } from './types';

export async function listBlocks(): Promise<Block[]> {
  const { data } = await api.get<{ blocks: Block[] }>('/api/admin/blocks');
  return data.blocks;
}

export async function createBlock(input: {
  startDate: string;
  endDate: string;
  reason?: string;
}): Promise<Block> {
  const { data } = await api.post<{ ok: true; block: Block }>('/api/admin/blocks', input);
  return data.block;
}

export async function deleteBlock(id: number): Promise<void> {
  await api.delete(`/api/admin/blocks/${id}`);
}
