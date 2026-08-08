export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          default_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          default_currency?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          destination: string;
          start_date: string;
          end_date: string;
          base_currency: string;
          budget_amount: number | null;
          cover_emoji: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          destination: string;
          start_date: string;
          end_date: string;
          base_currency: string;
          budget_amount?: number | null;
          cover_emoji?: string;
        };
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
        Relationships: [];
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string | null;
          display_name: string;
          email: string | null;
          role: 'owner' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id?: string | null;
          display_name: string;
          email?: string | null;
          role?: 'owner' | 'editor' | 'viewer';
        };
        Update: Partial<Database['public']['Tables']['trip_members']['Insert']>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          paid_by_member_id: string;
          title: string;
          notes: string | null;
          category: string;
          amount_minor: number;
          currency: string;
          exchange_rate_to_base: number;
          expense_date: string;
          split_method: 'equal' | 'exact' | 'percentage';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          paid_by_member_id: string;
          title: string;
          notes?: string | null;
          category: string;
          amount_minor: number;
          currency: string;
          exchange_rate_to_base?: number;
          expense_date: string;
          split_method: 'equal' | 'exact' | 'percentage';
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          member_id: string;
          share_minor: number;
          percentage: number | null;
        };
        Insert: {
          id?: string;
          expense_id: string;
          member_id: string;
          share_minor: number;
          percentage?: number | null;
        };
        Update: Partial<Database['public']['Tables']['expense_splits']['Insert']>;
        Relationships: [];
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          created_by: string;
          title: string;
          notes: string | null;
          location_name: string | null;
          starts_at: string;
          ends_at: string | null;
          estimated_cost_minor: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          created_by: string;
          title: string;
          notes?: string | null;
          location_name?: string | null;
          starts_at: string;
          ends_at?: string | null;
          estimated_cost_minor?: number | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['itinerary_items']['Insert']>;
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          trip_id: string;
          from_member_id: string;
          to_member_id: string;
          amount_minor: number;
          currency: string;
          status: 'planned' | 'paid';
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_member_id: string;
          to_member_id: string;
          amount_minor: number;
          currency: string;
          status?: 'planned' | 'paid';
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['settlements']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_owned_trip: {
        Args: { p_trip_id: string };
        Returns: undefined;
      };
      prepare_account_deletion: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      upsert_expense_with_splits: {
        Args: { p_expense: Json; p_splits: Json };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
