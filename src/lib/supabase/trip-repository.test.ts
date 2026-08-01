import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Expense } from '@/types/domain';
import { supabase } from './client';
import { upsertRemoteExpense } from './trip-repository';

jest.mock('./client', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    rpc: jest.fn(),
  },
}));

const client = supabase as unknown as {
  auth: { getUser: jest.Mock };
  rpc: jest.Mock;
} & SupabaseClient<Database>;

const expense: Expense = {
  id: '00000000-0000-4000-8000-000000000001',
  tripId: '00000000-0000-4000-8000-000000000002',
  createdBy: 'temporary-local-user',
  paidByMemberId: '00000000-0000-4000-8000-000000000003',
  title: 'Akşam yemeği',
  notes: null,
  category: 'food',
  amountMinor: 101,
  currency: 'TRY',
  exchangeRateMillionths: 1_000_000,
  expenseDate: '2026-08-01',
  splitMethod: 'percentage',
  splits: [
    {
      id: '00000000-0000-4000-8000-000000000004',
      expenseId: '00000000-0000-4000-8000-000000000001',
      memberId: '00000000-0000-4000-8000-000000000003',
      shareMinor: 101,
      percentageBasisPoints: 10_000,
    },
  ],
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('trip repository expense persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    client.auth.getUser.mockResolvedValue({
      data: { user: { id: 'real-auth-user' } },
      error: null,
    });
    client.rpc.mockResolvedValue({ data: expense.id, error: null });
  });

  it('saves an expense and its splits through one atomic RPC call', async () => {
    const saved = await upsertRemoteExpense(expense);
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith(
      'upsert_expense_with_splits',
      expect.objectContaining({
        p_expense: expect.objectContaining({ amount_minor: 101, split_method: 'percentage' }),
        p_splits: [expect.objectContaining({ share_minor: 101, percentage: 100 })],
      }),
    );
    expect(saved.createdBy).toBe('real-auth-user');
  });
});
