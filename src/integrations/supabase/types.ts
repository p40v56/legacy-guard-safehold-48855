export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_time: string
          created_at: string
          id: string
          ip_address: string | null
          location: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      digital_accounts: {
        Row: {
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string | null
          id: string
          notes: string | null
          password_encrypted: string | null
          platform: string
          updated_at: string
          user_id: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          account_name: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          password_encrypted?: string | null
          platform: string
          updated_at?: string
          user_id: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          account_name?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          password_encrypted?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          can_access_accounts: boolean
          can_receive_messages: boolean
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          priority_order: number
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_access_accounts?: boolean
          can_receive_messages?: boolean
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          priority_order?: number
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_access_accounts?: boolean
          can_receive_messages?: boolean
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          priority_order?: number
          relationship?: string | null
          updated_at?: string
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
      legacy_messages: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string
          delay_days: number | null
          id: string
          is_sent: boolean
          message_type: Database["public"]["Enums"]["message_type"]
          send_immediately: boolean
          sent_at: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string
          delay_days?: number | null
          id?: string
          is_sent?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          send_immediately?: boolean
          sent_at?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string
          delay_days?: number | null
          id?: string
          is_sent?: boolean
          message_type?: Database["public"]["Enums"]["message_type"]
          send_immediately?: boolean
          sent_at?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "emergency_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          emergency_email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          check_in_frequency: Database["public"]["Enums"]["check_in_frequency"]
          created_at: string
          grace_period_hours: number
          id: string
          is_active: boolean
          last_check_in: string | null
          next_check_in_due: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          created_at?: string
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          last_check_in?: string | null
          next_check_in_due?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_frequency?: Database["public"]["Enums"]["check_in_frequency"]
          created_at?: string
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
      account_type:
        | "email"
        | "social_media"
        | "financial"
        | "subscription"
        | "gaming"
        | "work"
        | "other"
      check_in_frequency: "daily" | "weekly" | "biweekly" | "monthly"
      contact_type: "primary" | "secondary" | "professional" | "legal"
      message_type: "personal" | "professional" | "legal" | "closure"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: [
        "email",
        "social_media",
        "financial",
        "subscription",
        "gaming",
        "work",
        "other",
      ],
      check_in_frequency: ["daily", "weekly", "biweekly", "monthly"],
      contact_type: ["primary", "secondary", "professional", "legal"],
      message_type: ["personal", "professional", "legal", "closure"],
    },
  },
} as const
