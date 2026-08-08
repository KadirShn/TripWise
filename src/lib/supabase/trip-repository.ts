import type { Database, Json } from '@/types/database';
import type { Expense, ExpenseCategory, ItineraryItem, Trip, TripMember } from '@/types/domain';
import { supabase } from './client';

type TripRow = Database['public']['Tables']['trips']['Row'];
type MemberRow = Database['public']['Tables']['trip_members']['Row'];
type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type SplitRow = Database['public']['Tables']['expense_splits']['Row'];
type ItineraryRow = Database['public']['Tables']['itinerary_items']['Row'];

export interface RemoteSnapshot {
  trips: Trip[];
  members: TripMember[];
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
}
const client = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};
const requireUser = async () => {
  const { data, error } = await client().auth.getUser();
  if (error || !data.user) throw error ?? new Error('AUTH_REQUIRED');
  return data.user;
};
const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};
const mapTrip = (row: TripRow): Trip => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  destination: row.destination,
  startDate: row.start_date,
  endDate: row.end_date,
  baseCurrency: row.base_currency,
  budgetAmountMinor: row.budget_amount,
  coverEmoji: row.cover_emoji,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const mapMember = (row: MemberRow): TripMember => ({
  id: row.id,
  tripId: row.trip_id,
  userId: row.user_id,
  displayName: row.display_name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});
const mapItinerary = (row: ItineraryRow): ItineraryItem => ({
  id: row.id,
  tripId: row.trip_id,
  createdBy: row.created_by,
  title: row.title,
  notes: row.notes,
  locationName: row.location_name,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  estimatedCostMinor: row.estimated_cost_minor,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
const mapExpense = (row: ExpenseRow, splits: SplitRow[]): Expense => ({
  id: row.id,
  tripId: row.trip_id,
  createdBy: row.created_by,
  paidByMemberId: row.paid_by_member_id,
  title: row.title,
  notes: row.notes,
  category: row.category as ExpenseCategory,
  amountMinor: row.amount_minor,
  currency: row.currency,
  exchangeRateMillionths: Math.round(Number(row.exchange_rate_to_base) * 1_000_000),
  expenseDate: row.expense_date,
  splitMethod: row.split_method,
  splits: splits
    .filter((split) => split.expense_id === row.id)
    .map((split) => ({
      id: split.id,
      expenseId: split.expense_id,
      memberId: split.member_id,
      shareMinor: split.share_minor,
      percentageBasisPoints:
        split.percentage === null ? null : Math.round(Number(split.percentage) * 100),
    })),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function fetchRemoteSnapshot(): Promise<RemoteSnapshot> {
  const { data: tripRows, error: tripError } = await client()
    .from('trips')
    .select('*')
    .order('start_date', { ascending: false });
  fail(tripError);
  const trips = (tripRows ?? []).map(mapTrip);
  const tripIds = trips.map((trip) => trip.id);
  if (!tripIds.length) return { trips: [], members: [], expenses: [], itineraryItems: [] };
  const [
    { data: memberRows, error: memberError },
    { data: expenseRows, error: expenseError },
    { data: itineraryRows, error: itineraryError },
  ] = await Promise.all([
    client().from('trip_members').select('*').in('trip_id', tripIds),
    client().from('expenses').select('*').in('trip_id', tripIds),
    client().from('itinerary_items').select('*').in('trip_id', tripIds),
  ]);
  fail(memberError);
  fail(expenseError);
  fail(itineraryError);
  const expenseIds = (expenseRows ?? []).map((expense) => expense.id);
  let splitRows: SplitRow[] = [];
  if (expenseIds.length) {
    const { data, error } = await client()
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);
    fail(error);
    splitRows = data ?? [];
  }
  return {
    trips,
    members: (memberRows ?? []).map(mapMember),
    expenses: (expenseRows ?? []).map((row) => mapExpense(row, splitRows)),
    itineraryItems: (itineraryRows ?? []).map(mapItinerary),
  };
}

export async function createRemoteTrip(
  trip: Trip,
  ownerMember: TripMember,
): Promise<{ trip: Trip; ownerMember: TripMember }> {
  const user = await requireUser();
  const { error } = await client().from('trips').insert({
    id: trip.id,
    owner_id: user.id,
    title: trip.title,
    destination: trip.destination,
    start_date: trip.startDate,
    end_date: trip.endDate,
    base_currency: trip.baseCurrency,
    budget_amount: trip.budgetAmountMinor,
    cover_emoji: trip.coverEmoji,
  });
  fail(error);
  const displayName = String(
    user.user_metadata.display_name ?? user.email?.split('@')[0] ?? ownerMember.displayName,
  );
  const persistedOwner: TripMember = {
    ...ownerMember,
    userId: user.id,
    displayName,
    email: user.email ?? null,
    role: 'owner',
  };
  const { error: memberError } = await client().from('trip_members').insert({
    id: persistedOwner.id,
    trip_id: persistedOwner.tripId,
    user_id: persistedOwner.userId,
    display_name: persistedOwner.displayName,
    email: persistedOwner.email,
    role: persistedOwner.role,
  });
  if (memberError) {
    const { error: cleanupError } = await client().from('trips').delete().eq('id', trip.id);
    if (__DEV__ && cleanupError)
      console.info('[TripWise] Failed to clean up an incomplete trip', cleanupError.message);
    fail(memberError);
  }
  return { trip: { ...trip, ownerId: user.id }, ownerMember: persistedOwner };
}

export async function updateRemoteTrip(
  tripId: string,
  patch: Partial<Omit<Trip, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const { error } = await client()
    .from('trips')
    .update({
      title: patch.title,
      destination: patch.destination,
      start_date: patch.startDate,
      end_date: patch.endDate,
      base_currency: patch.baseCurrency,
      budget_amount: patch.budgetAmountMinor,
      cover_emoji: patch.coverEmoji,
    })
    .eq('id', tripId);
  fail(error);
}
export async function deleteRemoteTrip(tripId: string): Promise<void> {
  const { error } = await client().rpc('delete_owned_trip', { p_trip_id: tripId });
  fail(error);
}
export async function addRemoteMember(member: TripMember): Promise<TripMember> {
  const { data, error } = await client()
    .from('trip_members')
    .insert({
      id: member.id,
      trip_id: member.tripId,
      user_id: member.userId,
      display_name: member.displayName,
      email: member.email,
      role: member.role,
    })
    .select()
    .single();
  fail(error);
  return mapMember(data as MemberRow);
}
export async function updateRemoteMember(
  memberId: string,
  patch: Partial<Omit<TripMember, 'id' | 'createdAt'>>,
): Promise<void> {
  const { error } = await client()
    .from('trip_members')
    .update({ display_name: patch.displayName, email: patch.email, role: patch.role })
    .eq('id', memberId);
  fail(error);
}
export async function deleteRemoteMember(memberId: string): Promise<void> {
  const { error } = await client().from('trip_members').delete().eq('id', memberId);
  fail(error);
}
export async function upsertRemoteExpense(expense: Expense): Promise<Expense> {
  const user = await requireUser();
  const remote = { ...expense, createdBy: user.id };
  const expensePayload: Json = {
    id: remote.id,
    trip_id: remote.tripId,
    paid_by_member_id: remote.paidByMemberId,
    title: remote.title,
    notes: remote.notes,
    category: remote.category,
    amount_minor: remote.amountMinor,
    currency: remote.currency,
    exchange_rate_to_base: remote.exchangeRateMillionths / 1_000_000,
    expense_date: remote.expenseDate,
    split_method: remote.splitMethod,
  };
  const splitPayload: Json = remote.splits.map((split) => ({
    id: split.id,
    member_id: split.memberId,
    share_minor: split.shareMinor,
    percentage: split.percentageBasisPoints === null ? null : split.percentageBasisPoints / 100,
  }));
  const { error } = await client().rpc('upsert_expense_with_splits', {
    p_expense: expensePayload,
    p_splits: splitPayload,
  });
  fail(error);
  return remote;
}
export async function deleteRemoteExpense(expenseId: string): Promise<void> {
  const { error } = await client().from('expenses').delete().eq('id', expenseId);
  fail(error);
}
export async function addRemoteItinerary(item: ItineraryItem): Promise<ItineraryItem> {
  const user = await requireUser();
  const { data, error } = await client()
    .from('itinerary_items')
    .insert({
      id: item.id,
      trip_id: item.tripId,
      created_by: user.id,
      title: item.title,
      notes: item.notes,
      location_name: item.locationName,
      starts_at: item.startsAt,
      ends_at: item.endsAt,
      estimated_cost_minor: item.estimatedCostMinor,
      sort_order: item.sortOrder,
    })
    .select()
    .single();
  fail(error);
  return mapItinerary(data as ItineraryRow);
}
export async function updateRemoteItinerary(
  itemId: string,
  patch: Partial<Omit<ItineraryItem, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const { error } = await client()
    .from('itinerary_items')
    .update({
      title: patch.title,
      notes: patch.notes,
      location_name: patch.locationName,
      starts_at: patch.startsAt,
      ends_at: patch.endsAt,
      estimated_cost_minor: patch.estimatedCostMinor,
      sort_order: patch.sortOrder,
    })
    .eq('id', itemId);
  fail(error);
}
export async function deleteRemoteItinerary(itemId: string): Promise<void> {
  const { error } = await client().from('itinerary_items').delete().eq('id', itemId);
  fail(error);
}
