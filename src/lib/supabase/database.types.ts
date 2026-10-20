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
      feedback: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          status?: string
        }
        Relationships: []
      }
      teaching_edit_state: {
        Row: {
          last_save_hash: string | null
          last_save_id: string | null
          revision: number
          teaching_id: string
        }
        Insert: {
          last_save_hash?: string | null
          last_save_id?: string | null
          revision?: number
          teaching_id: string
        }
        Update: {
          last_save_hash?: string | null
          last_save_id?: string | null
          revision?: number
          teaching_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_edit_state_teaching_id_fkey"
            columns: ["teaching_id"]
            isOneToOne: true
            referencedRelation: "teachings"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_translations: {
        Row: {
          article_content: Json
          created_at: string
          excerpt: string
          id: string
          language: string
          published_at: string | null
          slug: string
          status: string
          teaching_id: string
          title: string
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          article_content: Json
          created_at?: string
          excerpt: string
          id?: string
          language: string
          published_at?: string | null
          slug: string
          status?: string
          teaching_id: string
          title: string
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          article_content?: Json
          created_at?: string
          excerpt?: string
          id?: string
          language?: string
          published_at?: string | null
          slug?: string
          status?: string
          teaching_id?: string
          title?: string
          updated_at?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_translations_teaching_id_fkey"
            columns: ["teaching_id"]
            isOneToOne: false
            referencedRelation: "teachings"
            referencedColumns: ["id"]
          },
        ]
      }
      teachings: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachings_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          id: string
          name_am: string
          name_en: string
        }
        Insert: {
          id: string
          name_am: string
          name_en: string
        }
        Update: {
          id?: string
          name_am?: string
          name_en?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_teaching: { Args: { p_id: string }; Returns: Json }
      is_owner: { Args: never; Returns: boolean }
      save_admin_teaching: { Args: { p_payload: Json }; Returns: Json }
      submit_public_feedback: {
        Args: { p_email: string; p_message: string; p_name: string }
        Returns: string
      }
      trim_input: { Args: { value: string }; Returns: string }
      utf16_length: { Args: { value: string }; Returns: number }
      valid_article_content: { Args: { document: Json }; Returns: boolean }
      valid_feedback_email: { Args: { value: string }; Returns: boolean }
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
