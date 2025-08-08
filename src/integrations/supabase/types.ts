export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          closure_action: string
          created_at: string
          email: string | null
          id: string
          importance: string
          notes: string | null
          platform: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_type?: string
          closure_action?: string
          created_at?: string
          email?: string | null
          id?: string
          importance?: string
          notes?: string | null
          platform: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_type?: string
          closure_action?: string
          created_at?: string
          email?: string | null
          id?: string
          importance?: string
          notes?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      activation_rules: {
        Row: {
          contact_category: string | null
          contact_ids: string[] | null
          created_at: string
          custom_message: string | null
          delay_hours: number | null
          enabled: boolean | null
          id: string
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_category?: string | null
          contact_ids?: string[] | null
          created_at?: string
          custom_message?: string | null
          delay_hours?: number | null
          enabled?: boolean | null
          id?: string
          target_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_category?: string | null
          contact_ids?: string[] | null
          created_at?: string
          custom_message?: string | null
          delay_hours?: number | null
          enabled?: boolean | null
          id?: string
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_type_permissions: {
        Row: {
          contact_type: string
          created_at: string
          default_permissions: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          default_permissions: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          default_permissions?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          can_receive_messages: boolean | null
          contact_type: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          permissions: Json | null
          phone: string | null
          priority_order: number | null
          relationship: string | null
          updated_at: string
          use_type_defaults: boolean | null
          user_id: string
        }
        Insert: {
          can_receive_messages?: boolean | null
          contact_type?: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          priority_order?: number | null
          relationship?: string | null
          updated_at?: string
          use_type_defaults?: boolean | null
          user_id: string
        }
        Update: {
          can_receive_messages?: boolean | null
          contact_type?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          priority_order?: number | null
          relationship?: string | null
          updated_at?: string
          use_type_defaults?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      legacy_documents: {
        Row: {
          created_at: string
          description: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          emergency_alerts: boolean | null
          id: string
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          emergency_instructions: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          emergency_instructions?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          emergency_instructions?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          check_in_frequency: string
          created_at: string
          custom_deadline: string | null
          deadline_mode: string
          grace_period_hours: number
          id: string
          is_active: boolean
          last_check_in: string | null
          next_check_in_due: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_frequency?: string
          created_at?: string
          custom_deadline?: string | null
          deadline_mode?: string
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          last_check_in?: string | null
          next_check_in_due?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_frequency?: string
          created_at?: string
          custom_deadline?: string | null
          deadline_mode?: string
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          last_check_in?: string | null
          next_check_in_due?: string | null
          updated_at?: string
          user_id?: string
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
