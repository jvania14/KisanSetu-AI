export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          area: number | null
          created_at: string
          id: string
          name: string
          next_task: string | null
          sowing_date: string | null
          stage: string | null
          user_id: string
          variety: string | null
        }
        Insert: {
          area?: number | null
          created_at?: string
          id?: string
          name: string
          next_task?: string | null
          sowing_date?: string | null
          stage?: string | null
          user_id: string
          variety?: string | null
        }
        Update: {
          area?: number | null
          created_at?: string
          id?: string
          name?: string
          next_task?: string | null
          sowing_date?: string | null
          stage?: string | null
          user_id?: string
          variety?: string | null
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          created_at: string
          crop: string | null
          id: string
          image_path: string | null
          result: Json | null
          stage: string | null
          symptoms: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          crop?: string | null
          id?: string
          image_path?: string | null
          result?: Json | null
          stage?: string | null
          symptoms?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          crop?: string | null
          id?: string
          image_path?: string | null
          result?: Json | null
          stage?: string | null
          symptoms?: string | null
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          created_at: string
          crop: string
          description: string | null
          id: string
          location: string | null
          price: number
          quantity: number
          seller_name: string | null
          status: string
          unit: string
          user_id: string
          variety: string | null
        }
        Insert: {
          created_at?: string
          crop: string
          description?: string | null
          id?: string
          location?: string | null
          price: number
          quantity: number
          seller_name?: string | null
          status?: string
          unit?: string
          user_id: string
          variety?: string | null
        }
        Update: {
          created_at?: string
          crop?: string
          description?: string | null
          id?: string
          location?: string | null
          price?: number
          quantity?: number
          seller_name?: string | null
          status?: string
          unit?: string
          user_id?: string
          variety?: string | null
        }
        Relationships: []
      }
      mandi_prices: {
        Row: {
          commodity: string
          created_at: string
          distance_km: number
          id: string
          market: string
          observed_on: string
          price_per_quintal: number
          source_note: string | null
          user_id: string
        }
        Insert: {
          commodity: string
          created_at?: string
          distance_km?: number
          id?: string
          market: string
          observed_on?: string
          price_per_quintal: number
          source_note?: string | null
          user_id: string
        }
        Update: {
          commodity?: string
          created_at?: string
          distance_km?: number
          id?: string
          market?: string
          observed_on?: string
          price_per_quintal?: number
          source_note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buyer_id: string
          buyer_name: string | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          price: number
          quantity: number
          status: string
        }
        Insert: {
          buyer_id: string
          buyer_name?: string | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          price: number
          quantity: number
          status?: string
        }
        Update: {
          buyer_id?: string
          buyer_name?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          price?: number
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_unit: string
          created_at: string
          district: string | null
          farm_area: number | null
          full_name: string | null
          id: string
          irrigation: string | null
          k_value: number | null
          latitude: number | null
          longitude: number | null
          n_value: number | null
          onboarded: boolean
          p_value: number | null
          preferred_language: string
          soil_ph: number | null
          soil_type: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          area_unit?: string
          created_at?: string
          district?: string | null
          farm_area?: number | null
          full_name?: string | null
          id: string
          irrigation?: string | null
          k_value?: number | null
          latitude?: number | null
          longitude?: number | null
          n_value?: number | null
          onboarded?: boolean
          p_value?: number | null
          preferred_language?: string
          soil_ph?: number | null
          soil_type?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          area_unit?: string
          created_at?: string
          district?: string | null
          farm_area?: number | null
          full_name?: string | null
          id?: string
          irrigation?: string | null
          k_value?: number | null
          latitude?: number | null
          longitude?: number | null
          n_value?: number | null
          onboarded?: boolean
          p_value?: number | null
          preferred_language?: string
          soil_ph?: number | null
          soil_type?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
