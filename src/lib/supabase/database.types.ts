export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      artists: {
        Row: {
          city_id: number | null;
          created_at: string;
          hidden_at: string | null;
          id: string;
          merged_into_id: string | null;
          name: string;
          short_id: string;
          updated_at: string;
          used_by_others_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          city_id?: number | null;
          created_at?: string;
          hidden_at?: string | null;
          id?: string;
          merged_into_id?: string | null;
          name: string;
          short_id?: string;
          updated_at?: string;
          used_by_others_at?: string | null;
        };
        Update: {
          city_id?: number | null;
          created_at?: string;
          hidden_at?: string | null;
          id?: string;
          merged_into_id?: string | null;
          name?: string;
          short_id?: string;
          updated_at?: string;
          used_by_others_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artists_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artists_merged_into_id_fkey";
            columns: ["merged_into_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          }
        ];
      };
      catalog_edits: {
        Row: {
          created_at: string;
          edited_by: string | null;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["catalog_type"];
          field: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
          reverts_edit_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          edited_by?: string | null;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["catalog_type"];
          field: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          reverts_edit_id?: string | null;
        };
        Update: {
          created_at?: string;
          edited_by?: string | null;
          entity_id?: string;
          entity_type?: Database["public"]["Enums"]["catalog_type"];
          field?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
          reverts_edit_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_edits_edited_by_fkey";
            columns: ["edited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "catalog_edits_reverts_edit_id_fkey";
            columns: ["reverts_edit_id"];
            isOneToOne: false;
            referencedRelation: "catalog_edits";
            referencedColumns: ["id"];
          }
        ];
      };
      cities: {
        Row: {
          admin1_name: string | null;
          ascii_name: string;
          country_code: string;
          id: number;
          name: string;
          population: number;
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          admin1_name?: string | null;
          ascii_name: string;
          country_code: string;
          id: number;
          name: string;
          population: number;
          timezone: string;
        };
        Update: {
          admin1_name?: string | null;
          ascii_name?: string;
          country_code?: string;
          id?: number;
          name?: string;
          population?: number;
          timezone?: string;
        };
        Relationships: [];
      };
      city_names: {
        Row: {
          city_id: number;
          language: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          city_id: number;
          language: string;
          name: string;
        };
        Update: {
          city_id?: number;
          language?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "city_names_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          }
        ];
      };
      creations: {
        Row: {
          artist_id: string | null;
          collective_id: string | null;
          created_at: string;
          created_by: string;
          event_id: string | null;
          id: string;
          lineup_slot_id: string | null;
          venue_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          artist_id?: string | null;
          collective_id?: string | null;
          created_at?: string;
          created_by?: string;
          event_id?: string | null;
          id?: string;
          lineup_slot_id?: string | null;
          venue_id?: string | null;
        };
        Update: {
          artist_id?: string | null;
          collective_id?: string | null;
          created_at?: string;
          created_by?: string;
          event_id?: string | null;
          id?: string;
          lineup_slot_id?: string | null;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "creations_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: true;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creations_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: true;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      link_platforms: {
        Row: {
          allowed_hosts: string[];
          id: string;
          is_for_artists: boolean;
          is_for_collectives: boolean;
          is_for_venues: boolean;
          label: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          allowed_hosts: string[];
          id: string;
          is_for_artists: boolean;
          is_for_collectives: boolean;
          is_for_venues: boolean;
          label: string;
          sort_order: number;
        };
        Update: {
          allowed_hosts?: string[];
          id?: string;
          is_for_artists?: boolean;
          is_for_collectives?: boolean;
          is_for_venues?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      links: {
        Row: {
          artist_id: string | null;
          collective_id: string | null;
          id: string;
          platform_id: string;
          url: string;
          venue_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          artist_id?: string | null;
          collective_id?: string | null;
          id?: string;
          platform_id: string;
          url: string;
          venue_id?: string | null;
        };
        Update: {
          artist_id?: string | null;
          collective_id?: string | null;
          id?: string;
          platform_id?: string;
          url?: string;
          venue_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "links_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "links_platform_id_fkey";
            columns: ["platform_id"];
            isOneToOne: false;
            referencedRelation: "link_platforms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "links_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          account_status_at: string | null;
          created_at: string;
          display_name: string | null;
          handle: string;
          id: string;
          role: Database["public"]["Enums"]["role"];
        };
        ComputedFields: never;
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          account_status_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          handle: string;
          id?: string;
          role?: Database["public"]["Enums"]["role"];
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          account_status_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          handle?: string;
          id?: string;
          role?: Database["public"]["Enums"]["role"];
        };
        Relationships: [];
      };
      sound_systems: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          name: string;
          sort_order: number;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      venue_sound_systems: {
        Row: {
          sound_system_id: string;
          venue_id: string;
        };
        ComputedFields: never;
        Insert: {
          sound_system_id: string;
          venue_id: string;
        };
        Update: {
          sound_system_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_sound_systems_sound_system_id_fkey";
            columns: ["sound_system_id"];
            isOneToOne: false;
            referencedRelation: "sound_systems";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_sound_systems_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      venues: {
        Row: {
          city_id: number;
          created_at: string;
          hidden_at: string | null;
          id: string;
          merged_into_id: string | null;
          name: string;
          short_id: string;
          updated_at: string;
          used_by_others_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          city_id: number;
          created_at?: string;
          hidden_at?: string | null;
          id?: string;
          merged_into_id?: string | null;
          name: string;
          short_id?: string;
          updated_at?: string;
          used_by_others_at?: string | null;
        };
        Update: {
          city_id?: number;
          created_at?: string;
          hidden_at?: string | null;
          id?: string;
          merged_into_id?: string | null;
          name?: string;
          short_id?: string;
          updated_at?: string;
          used_by_others_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venues_merged_into_id_fkey";
            columns: ["merged_into_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_artist: {
        Args: { city_id?: number; links?: Json; name: string };
        Returns: {
          id: string;
          short_id: string;
        }[];
      };
      create_venue: {
        Args: {
          city_id: number;
          links?: Json;
          name: string;
          sound_system_ids?: string[];
        };
        Returns: {
          id: string;
          short_id: string;
        }[];
      };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      search_artists: {
        Args: { city_id?: number; max_results?: number; query: string };
        Returns: {
          home_city_admin1_name: string;
          home_city_country_code: string;
          home_city_id: number;
          home_city_name: string;
          id: string;
          is_exact: boolean;
          link_platform_ids: string[];
          name: string;
          short_id: string;
        }[];
      };
      search_cities: {
        Args: { max_results?: number; query: string };
        Returns: {
          admin1_name: string;
          country_code: string;
          id: number;
          matched_name: string;
          name: string;
        }[];
      };
      search_venues: {
        Args: { city_id: number; max_results?: number; query: string };
        Returns: {
          id: string;
          name: string;
          short_id: string;
        }[];
      };
    };
    Enums: {
      account_status: "active" | "banned";
      catalog_type: "venue" | "artist" | "collective" | "event" | "lineup_slot";
      role: "user" | "moderator" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {}
  },
  public: {
    Enums: {
      account_status: ["active", "banned"],
      catalog_type: ["venue", "artist", "collective", "event", "lineup_slot"],
      role: ["user", "moderator", "admin"]
    }
  }
} as const;
