export type Id = string;
export type CurrencyCode = string;
export type MemberRole = 'owner' | 'editor' | 'viewer';
export type SplitMethod = 'equal' | 'exact' | 'percentage';
export type ExpenseCategory =
  'accommodation' | 'transport' | 'food' | 'activity' | 'shopping' | 'other';

export interface Trip {
  id: Id;
  ownerId: Id;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  baseCurrency: CurrencyCode;
  budgetAmountMinor: number | null;
  coverEmoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: Id;
  tripId: Id;
  userId: Id | null;
  displayName: string;
  email: string | null;
  role: MemberRole;
  createdAt: string;
}

export interface ExpenseSplit {
  id: Id;
  expenseId: Id;
  memberId: Id;
  shareMinor: number;
  percentageBasisPoints: number | null;
}

export interface Expense {
  id: Id;
  tripId: Id;
  createdBy: Id;
  paidByMemberId: Id;
  title: string;
  notes: string | null;
  category: ExpenseCategory;
  amountMinor: number;
  currency: CurrencyCode;
  exchangeRateMillionths: number;
  expenseDate: string;
  splitMethod: SplitMethod;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: Id;
  tripId: Id;
  createdBy: Id;
  title: string;
  notes: string | null;
  locationName: string | null;
  startsAt: string;
  endsAt: string | null;
  estimatedCostMinor: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: Id;
  tripId: Id;
  fromMemberId: Id;
  toMemberId: Id;
  amountMinor: number;
  currency: CurrencyCode;
  status: 'planned' | 'paid';
  paidAt: string | null;
  createdAt: string;
}

export interface MemberBalance {
  memberId: Id;
  balanceMinor: number;
}

export interface SettlementTransfer {
  fromMemberId: Id;
  toMemberId: Id;
  amountMinor: number;
}

export interface TripBundle {
  trip: Trip;
  members: TripMember[];
  expenses: Expense[];
  itineraryItems: ItineraryItem[];
  settlements: Settlement[];
}

export interface TripInvite {
  code: string;
  tripId: Id;
  role: Exclude<MemberRole, 'owner'>;
  expiresAt: string;
}

export interface InvitePreview {
  tripId: Id;
  tripTitle: string;
  destination: string;
  coverEmoji: string;
  role: Exclude<MemberRole, 'owner'>;
  alreadyMember: boolean;
  unclaimedMembers: { id: Id; displayName: string }[];
}
