import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const url = required('SUPABASE_TEST_URL');
const key = required('SUPABASE_TEST_PUBLISHABLE_KEY');
const clientA = createClient(url, key, { auth: { persistSession: false } });
const clientB = createClient(url, key, { auth: { persistSession: false } });
const tripA = randomUUID();
const tripB = randomUUID();
const ownerA = randomUUID();
const ownerB = randomUUID();
const viewerB = randomUUID();
const validExpenseId = randomUUID();
const validSplitId = randomUUID();

const assertNoError = (label, error) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

const assertDenied = (label, error) => {
  if (!error) throw new Error(`${label}: operation unexpectedly succeeded`);
};

const tripRow = (id, ownerId, title) => ({
  id,
  owner_id: ownerId,
  title,
  destination: 'RLS test destination',
  start_date: '2030-01-01',
  end_date: '2030-01-02',
  base_currency: 'TRY',
  budget_amount: null,
  cover_emoji: '🧪',
});

const main = async () => {
  const emailA = required('SUPABASE_TEST_USER_A_EMAIL');
  const passwordA = required('SUPABASE_TEST_USER_A_PASSWORD');
  const emailB = required('SUPABASE_TEST_USER_B_EMAIL');
  const passwordB = required('SUPABASE_TEST_USER_B_PASSWORD');
  const { data: authA, error: authAError } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: passwordA,
  });
  const { data: authB, error: authBError } = await clientB.auth.signInWithPassword({
    email: emailB,
    password: passwordB,
  });
  assertNoError('Sign in user A', authAError);
  assertNoError('Sign in user B', authBError);
  if (!authA.user || !authB.user) throw new Error('Both test users must be authenticated');

  try {
    assertNoError(
      'Create private trip A',
      (await clientA.from('trips').insert(tripRow(tripA, authA.user.id, 'RLS trip A'))).error,
    );
    assertNoError(
      'Create owner member A',
      (
        await clientA.from('trip_members').insert({
          id: ownerA,
          trip_id: tripA,
          user_id: authA.user.id,
          display_name: 'Owner A',
          role: 'owner',
        })
      ).error,
    );

    const validExpense = await clientA.rpc('upsert_expense_with_splits', {
      p_expense: {
        id: validExpenseId,
        trip_id: tripA,
        paid_by_member_id: ownerA,
        title: 'Valid atomic expense',
        notes: null,
        category: 'food',
        amount_minor: 100,
        currency: 'TRY',
        exchange_rate_to_base: 1,
        expense_date: '2030-01-01',
        split_method: 'equal',
      },
      p_splits: [
        {
          id: validSplitId,
          member_id: ownerA,
          share_minor: 100,
          percentage: null,
        },
      ],
    });
    assertNoError('Create valid atomic expense', validExpense.error);

    const persistedExpense = await clientA.from('expenses').select('id').eq('id', validExpenseId);
    assertNoError('Read valid atomic expense', persistedExpense.error);
    if (persistedExpense.data?.length !== 1)
      throw new Error('Valid atomic expense was not persisted');

    const persistedSplits = await clientA
      .from('expense_splits')
      .select('id, share_minor')
      .eq('expense_id', validExpenseId);
    assertNoError('Read valid atomic expense splits', persistedSplits.error);
    if (persistedSplits.data?.length !== 1 || persistedSplits.data[0]?.share_minor !== 100)
      throw new Error('Valid atomic expense split was not persisted correctly');

    const hiddenFromB = await clientB.from('trips').select('id').eq('id', tripA);
    assertNoError('Read private trip as user B', hiddenFromB.error);
    if (hiddenFromB.data?.length !== 0)
      throw new Error('User B saw a private trip before membership');

    assertNoError(
      'Add user B as viewer',
      (
        await clientA.from('trip_members').insert({
          id: viewerB,
          trip_id: tripA,
          user_id: authB.user.id,
          display_name: 'Viewer B',
          role: 'viewer',
        })
      ).error,
    );
    const visibleToB = await clientB.from('trips').select('id').eq('id', tripA);
    assertNoError('Read member trip as user B', visibleToB.error);
    if (visibleToB.data?.length !== 1) throw new Error('Viewer could not read the shared trip');

    const viewerWrite = await clientB.from('itinerary_items').insert({
      id: randomUUID(),
      trip_id: tripA,
      created_by: authB.user.id,
      title: 'Viewer must not create this',
      starts_at: '2030-01-01T09:00:00Z',
    });
    assertDenied('Viewer write policy', viewerWrite.error);

    const invalidExpenseId = randomUUID();
    const invalidExpense = await clientA.rpc('upsert_expense_with_splits', {
      p_expense: {
        id: invalidExpenseId,
        trip_id: tripA,
        paid_by_member_id: ownerA,
        title: 'Invalid atomic expense',
        notes: null,
        category: 'food',
        amount_minor: 100,
        currency: 'TRY',
        exchange_rate_to_base: 1,
        expense_date: '2030-01-01',
        split_method: 'exact',
      },
      p_splits: [{ id: randomUUID(), member_id: ownerA, share_minor: 99, percentage: null }],
    });
    assertDenied('Invalid split transaction', invalidExpense.error);
    const partialExpense = await clientA.from('expenses').select('id').eq('id', invalidExpenseId);
    assertNoError('Check transaction rollback', partialExpense.error);
    if (partialExpense.data?.length !== 0) throw new Error('Invalid RPC left a partial expense');

    assertNoError(
      'Create private trip B',
      (await clientB.from('trips').insert(tripRow(tripB, authB.user.id, 'RLS trip B'))).error,
    );
    assertNoError(
      'Create owner member B',
      (
        await clientB.from('trip_members').insert({
          id: ownerB,
          trip_id: tripB,
          user_id: authB.user.id,
          display_name: 'Owner B',
          role: 'owner',
        })
      ).error,
    );
    const hiddenFromA = await clientA.from('trips').select('id').eq('id', tripB);
    assertNoError('Read private trip as user A', hiddenFromA.error);
    if (hiddenFromA.data?.length !== 0) throw new Error('User A saw user B private trip');

    process.stdout.write('Supabase RLS two-user verification passed.\n');
  } finally {
    await clientA.rpc('delete_owned_trip', { p_trip_id: tripA });
    await clientB.rpc('delete_owned_trip', { p_trip_id: tripB });
    await clientA.auth.signOut({ scope: 'local' });
    await clientB.auth.signOut({ scope: 'local' });
  }
};

await main();
