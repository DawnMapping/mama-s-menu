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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      books: {
        Row: {
          book_source: string
          file_path: string
          file_type: string
          id: string
          title: string
          uploaded_at: string
        }
        Insert: {
          book_source: string
          file_path: string
          file_type?: string
          id?: string
          title: string
          uploaded_at?: string
        }
        Update: {
          book_source?: string
          file_path?: string
          file_type?: string
          id?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      extraction_jobs: {
        Row: {
          book_id: string
          created_at: string
          error: string | null
          id: string
          progress: number
          result_count: number | null
          status: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          result_count?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          error?: string | null
          id?: string
          progress?: number
          result_count?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      locked_meals: {
        Row: {
          day: string
          id: string
          locked_at: string
          notes: string | null
          recipe_id: string
          warnings_at_lock: string[] | null
        }
        Insert: {
          day: string
          id?: string
          locked_at?: string
          notes?: string | null
          recipe_id: string
          warnings_at_lock?: string[] | null
        }
        Update: {
          day?: string
          id?: string
          locked_at?: string
          notes?: string | null
          recipe_id?: string
          warnings_at_lock?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "locked_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          banned_ingredients_found: string[] | null
          book_source: string | null
          created_at: string
          id: string
          image_url: string | null
          ingredients: string | null
          instructions: string | null
          page_reference: string | null
          status: string
          title: string
          warnings: string[] | null
        }
        Insert: {
          banned_ingredients_found?: string[] | null
          book_source?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          page_reference?: string | null
          status?: string
          title: string
          warnings?: string[] | null
        }
        Update: {
          banned_ingredients_found?: string[] | null
          book_source?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          instructions?: string | null
          page_reference?: string | null
          status?: string
          title?: string
          warnings?: string[] | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          checked: boolean
          created_at: string
          id: string
          ingredient: string
          meal_day: string | null
          recipe_id: string | null
        }
        Insert: {
          checked?: boolean
          created_at?: string
          id?: string
          ingredient: string
          meal_day?: string | null
          recipe_id?: string | null
        }
        Update: {
          checked?: boolean
          created_at?: string
          id?: string
          ingredient?: string
          meal_day?: string | null
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
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
