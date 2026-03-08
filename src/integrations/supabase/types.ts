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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_name: string
          account_name_iv: string | null
          account_type: string
          attached_document_ids: string[] | null
          closure_action: string | null
          created_at: string
          credentials: string | null
          credentials_iv: string | null
          email: string | null
          email_iv: string | null
          id: string
          importance: string | null
          notes: string | null
          notes_iv: string | null
          platform: string | null
          platform_iv: string | null
          updated_at: string
          user_id: string
          username: string | null
          username_iv: string | null
          website_url: string | null
          website_url_iv: string | null
        }
        Insert: {
          account_name: string
          account_name_iv?: string | null
          account_type: string
          attached_document_ids?: string[] | null
          closure_action?: string | null
          created_at?: string
          credentials?: string | null
          credentials_iv?: string | null
          email?: string | null
          email_iv?: string | null
          id?: string
          importance?: string | null
          notes?: string | null
          notes_iv?: string | null
          platform?: string | null
          platform_iv?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          username_iv?: string | null
          website_url?: string | null
          website_url_iv?: string | null
        }
        Update: {
          account_name?: string
          account_name_iv?: string | null
          account_type?: string
          attached_document_ids?: string[] | null
          closure_action?: string | null
          created_at?: string
          credentials?: string | null
          credentials_iv?: string | null
          email?: string | null
          email_iv?: string | null
          id?: string
          importance?: string | null
          notes?: string | null
          notes_iv?: string | null
          platform?: string | null
          platform_iv?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          username_iv?: string | null
          website_url?: string | null
          website_url_iv?: string | null
        }
        Relationships: []
      }
      activation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          contact_category: string | null
          contact_ids: string[] | null
          created_at: string
          custom_message: string | null
          custom_message_iv: string | null
          delay_hours: number
          enabled: boolean | null
          id: string
          is_active: boolean
          target_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          contact_category?: string | null
          contact_ids?: string[] | null
          created_at?: string
          custom_message?: string | null
          custom_message_iv?: string | null
          delay_hours: number
          enabled?: boolean | null
          id?: string
          is_active?: boolean
          target_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          contact_category?: string | null
          contact_ids?: string[] | null
          created_at?: string
          custom_message?: string | null
          custom_message_iv?: string | null
          delay_hours?: number
          enabled?: boolean | null
          id?: string
          is_active?: boolean
          target_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      check_in_history: {
        Row: {
          checked_in_at: string
          created_at: string
          deadline_at: string | null
          deadline_mode: string | null
          grace_period_hours: number | null
          id: string
          method: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          created_at?: string
          deadline_at?: string | null
          deadline_mode?: string | null
          grace_period_hours?: number | null
          id?: string
          method?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string
          created_at?: string
          deadline_at?: string | null
          deadline_mode?: string | null
          grace_period_hours?: number | null
          id?: string
          method?: string
          user_id?: string
        }
        Relationships: []
      }
      check_in_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          method: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          method?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          method?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_access_tokens: {
        Row: {
          contact_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_access_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_shares: {
        Row: {
          access_token_hash: string | null
          contact_id: string
          content_iv: string | null
          created_at: string
          document_id: string | null
          encrypted_content: string | null
          encrypted_share_key: string | null
          id: string
          share_key_iv: string | null
          shared_document_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_hash?: string | null
          contact_id: string
          content_iv?: string | null
          created_at?: string
          document_id?: string | null
          encrypted_content?: string | null
          encrypted_share_key?: string | null
          id?: string
          share_key_iv?: string | null
          shared_document_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_hash?: string | null
          contact_id?: string
          content_iv?: string | null
          created_at?: string
          document_id?: string | null
          encrypted_content?: string | null
          encrypted_share_key?: string | null
          id?: string
          share_key_iv?: string | null
          shared_document_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_shares_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legacy_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_type_permissions: {
        Row: {
          contact_type: string
          created_at: string
          default_permissions: Json | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_type: string
          created_at?: string
          default_permissions?: Json | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_type?: string
          created_at?: string
          default_permissions?: Json | null
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
          custom_message: string | null
          custom_message_iv: string | null
          email: string | null
          id: string
          name: string
          name_iv: string | null
          notes: string | null
          notes_iv: string | null
          permissions: Json | null
          phone: string | null
          phone_iv: string | null
          priority_order: number
          relationship: string | null
          relationship_iv: string | null
          updated_at: string
          use_type_defaults: boolean | null
          user_id: string
        }
        Insert: {
          can_receive_messages?: boolean | null
          contact_type: string
          created_at?: string
          custom_message?: string | null
          custom_message_iv?: string | null
          email?: string | null
          id?: string
          name: string
          name_iv?: string | null
          notes?: string | null
          notes_iv?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_iv?: string | null
          priority_order?: number
          relationship?: string | null
          relationship_iv?: string | null
          updated_at?: string
          use_type_defaults?: boolean | null
          user_id: string
        }
        Update: {
          can_receive_messages?: boolean | null
          contact_type?: string
          created_at?: string
          custom_message?: string | null
          custom_message_iv?: string | null
          email?: string | null
          id?: string
          name?: string
          name_iv?: string | null
          notes?: string | null
          notes_iv?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_iv?: string | null
          priority_order?: number
          relationship?: string | null
          relationship_iv?: string | null
          updated_at?: string
          use_type_defaults?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      financial_assets: {
        Row: {
          attached_document_ids: string[] | null
          category: string
          category_specific_fields: Json | null
          category_specific_fields_json: string | null
          category_specific_fields_json_iv: string | null
          contact_email: string | null
          contact_email_iv: string | null
          contact_name: string | null
          contact_name_iv: string | null
          contact_phone: string | null
          contact_phone_iv: string | null
          created_at: string
          estimated_value: number | null
          id: string
          institution: string | null
          institution_iv: string | null
          name: string
          name_iv: string | null
          notes: string | null
          notes_iv: string | null
          reference_number: string | null
          reference_number_iv: string | null
          updated_at: string
          user_id: string
          visible_to: string[] | null
        }
        Insert: {
          attached_document_ids?: string[] | null
          category: string
          category_specific_fields?: Json | null
          category_specific_fields_json?: string | null
          category_specific_fields_json_iv?: string | null
          contact_email?: string | null
          contact_email_iv?: string | null
          contact_name?: string | null
          contact_name_iv?: string | null
          contact_phone?: string | null
          contact_phone_iv?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          institution?: string | null
          institution_iv?: string | null
          name: string
          name_iv?: string | null
          notes?: string | null
          notes_iv?: string | null
          reference_number?: string | null
          reference_number_iv?: string | null
          updated_at?: string
          user_id: string
          visible_to?: string[] | null
        }
        Update: {
          attached_document_ids?: string[] | null
          category?: string
          category_specific_fields?: Json | null
          category_specific_fields_json?: string | null
          category_specific_fields_json_iv?: string | null
          contact_email?: string | null
          contact_email_iv?: string | null
          contact_name?: string | null
          contact_name_iv?: string | null
          contact_phone?: string | null
          contact_phone_iv?: string | null
          created_at?: string
          estimated_value?: number | null
          id?: string
          institution?: string | null
          institution_iv?: string | null
          name?: string
          name_iv?: string | null
          notes?: string | null
          notes_iv?: string | null
          reference_number?: string | null
          reference_number_iv?: string | null
          updated_at?: string
          user_id?: string
          visible_to?: string[] | null
        }
        Relationships: []
      }
      legacy_documents: {
        Row: {
          content: string | null
          content_iv: string | null
          created_at: string
          description: string | null
          description_iv: string | null
          document_type: string
          file_iv: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          title: string
          title_iv: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_iv?: string | null
          created_at?: string
          description?: string | null
          description_iv?: string | null
          document_type: string
          file_iv?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          title_iv?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_iv?: string | null
          created_at?: string
          description?: string | null
          description_iv?: string | null
          document_type?: string
          file_iv?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          title_iv?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_notifications: boolean
          emergency_alerts: boolean
          id: string
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          emergency_alerts?: boolean
          id?: string
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          emergency_alerts?: boolean
          id?: string
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portal_access_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          success: boolean | null
          token_hash: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          success?: boolean | null
          token_hash: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          success?: boolean | null
          token_hash?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          deactivated: boolean
          email_footer_message: string | null
          email_grace_intro: string | null
          email_grace_subject: string | null
          email_header_subtitle: string | null
          email_header_title: string | null
          email_intro_message: string | null
          email_subject: string | null
          emergency_instructions: string | null
          emergency_instructions_iv: string | null
          encrypted_vault_key: string | null
          first_name: string | null
          first_name_iv: string | null
          id: string
          last_name: string | null
          last_name_iv: string | null
          last_test_email_sent_at: string | null
          migration_complete: boolean | null
          phone: string | null
          plan: string
          plan_expires_at: string | null
          salt: string | null
          setup_wizard_dismissed: boolean | null
          updated_at: string
          user_id: string
          vault_key_iv: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          deactivated?: boolean
          email_footer_message?: string | null
          email_grace_intro?: string | null
          email_grace_subject?: string | null
          email_header_subtitle?: string | null
          email_header_title?: string | null
          email_intro_message?: string | null
          email_subject?: string | null
          emergency_instructions?: string | null
          emergency_instructions_iv?: string | null
          encrypted_vault_key?: string | null
          first_name?: string | null
          first_name_iv?: string | null
          id?: string
          last_name?: string | null
          last_name_iv?: string | null
          last_test_email_sent_at?: string | null
          migration_complete?: boolean | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          salt?: string | null
          setup_wizard_dismissed?: boolean | null
          updated_at?: string
          user_id: string
          vault_key_iv?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          deactivated?: boolean
          email_footer_message?: string | null
          email_grace_intro?: string | null
          email_grace_subject?: string | null
          email_header_subtitle?: string | null
          email_header_title?: string | null
          email_intro_message?: string | null
          email_subject?: string | null
          emergency_instructions?: string | null
          emergency_instructions_iv?: string | null
          encrypted_vault_key?: string | null
          first_name?: string | null
          first_name_iv?: string | null
          id?: string
          last_name?: string | null
          last_name_iv?: string | null
          last_test_email_sent_at?: string | null
          migration_complete?: boolean | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          salt?: string | null
          setup_wizard_dismissed?: boolean | null
          updated_at?: string
          user_id?: string
          vault_key_iv?: string | null
        }
        Relationships: []
      }
      security_questions: {
        Row: {
          answer_hash: string
          created_at: string
          hint: string | null
          id: string
          question: string
          target_contact_id: string | null
          target_contact_type: string | null
          target_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer_hash: string
          created_at?: string
          hint?: string | null
          id?: string
          question: string
          target_contact_id?: string | null
          target_contact_type?: string | null
          target_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer_hash?: string
          created_at?: string
          hint?: string | null
          id?: string
          question?: string
          target_contact_id?: string | null
          target_contact_type?: string | null
          target_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_questions_target_contact_id_fkey"
            columns: ["target_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_notifications: {
        Row: {
          acknowledged_at: string | null
          contact_id: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          contact_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          contact_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_notifications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_name: string | null
          id: string
          ip_address: string | null
          is_mobile: boolean | null
          last_active_at: string
          os: string | null
          session_token_hash: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_mobile?: boolean | null
          last_active_at?: string
          os?: string | null
          session_token_hash: string
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_mobile?: boolean | null
          last_active_at?: string
          os?: string | null
          session_token_hash?: string
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
          email_checkin_enabled: boolean | null
          grace_period_active: boolean
          grace_period_end: string | null
          grace_period_hours: number
          id: string
          is_active: boolean
          last_check_in: string | null
          next_check_in_due: string | null
          sms_checkin_enabled: boolean | null
          switch_triggered: boolean
          switch_triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_frequency?: string
          created_at?: string
          custom_deadline?: string | null
          deadline_mode?: string
          email_checkin_enabled?: boolean | null
          grace_period_active?: boolean
          grace_period_end?: string | null
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          last_check_in?: string | null
          next_check_in_due?: string | null
          sms_checkin_enabled?: boolean | null
          switch_triggered?: boolean
          switch_triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_frequency?: string
          created_at?: string
          custom_deadline?: string | null
          deadline_mode?: string
          email_checkin_enabled?: boolean | null
          grace_period_active?: boolean
          grace_period_end?: string | null
          grace_period_hours?: number
          id?: string
          is_active?: boolean
          last_check_in?: string | null
          next_check_in_due?: string | null
          sms_checkin_enabled?: boolean | null
          switch_triggered?: boolean
          switch_triggered_at?: string | null
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
      admin_get_stats: { Args: never; Returns: Json }
      admin_get_user_emails: {
        Args: { row_limit?: number }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      admin_list_profiles: {
        Args: never
        Returns: {
          bio: string | null
          created_at: string
          deactivated: boolean
          email_footer_message: string | null
          email_grace_intro: string | null
          email_grace_subject: string | null
          email_header_subtitle: string | null
          email_header_title: string | null
          email_intro_message: string | null
          email_subject: string | null
          emergency_instructions: string | null
          emergency_instructions_iv: string | null
          encrypted_vault_key: string | null
          first_name: string | null
          first_name_iv: string | null
          id: string
          last_name: string | null
          last_name_iv: string | null
          last_test_email_sent_at: string | null
          migration_complete: boolean | null
          phone: string | null
          plan: string
          plan_expires_at: string | null
          salt: string | null
          setup_wizard_dismissed: boolean | null
          updated_at: string
          user_id: string
          vault_key_iv: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_update_profile: {
        Args: { _profile_user_id: string; _updates: Json }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
