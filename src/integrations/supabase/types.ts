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
      carts: {
        Row: {
          created_at: string
          items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          banner_image: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_demo: boolean
          is_published: boolean
          legacy_id: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          banner_image?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_published?: boolean
          legacy_id?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          banner_image?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_published?: boolean
          legacy_id?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          legacy_id: string | null
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          legacy_id?: string | null
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          legacy_id?: string | null
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body: string
          created_at: string
          id: string
          legacy_id: string | null
          page_key: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          page_key: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          legacy_id?: string | null
          page_key?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string
          city: string
          country: string
          created_at: string
          first_name: string
          id: string
          is_default: boolean
          last_name: string
          legacy_id: string | null
          postal_code: string
          region: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string
          city: string
          country: string
          created_at?: string
          first_name: string
          id?: string
          is_default?: boolean
          last_name: string
          legacy_id?: string | null
          postal_code: string
          region: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string
          city?: string
          country?: string
          created_at?: string
          first_name?: string
          id?: string
          is_default?: boolean
          last_name?: string
          legacy_id?: string | null
          postal_code?: string
          region?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          created_at: string
          id: string
          inci: string
          legacy_id: string | null
          monograph: string
          name: string
          slug: string
          sort_order: number
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inci?: string
          legacy_id?: string | null
          monograph?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
          summary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inci?: string
          legacy_id?: string | null
          monograph?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          action: string
          adjustment_amount: number
          changed_by: string | null
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number | null
          product_id: string | null
          quantity_change: number
          reason: string
          variant_id: string
        }
        Insert: {
          action?: string
          adjustment_amount?: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number | null
          product_id?: string | null
          quantity_change?: number
          reason?: string
          variant_id?: string
        }
        Update: {
          action?: string
          adjustment_amount?: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number | null
          product_id?: string | null
          quantity_change?: number
          reason?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_user_mappings: {
        Row: {
          imported_at: string
          legacy_user_id: string
          user_id: string
        }
        Insert: {
          imported_at?: string
          legacy_user_id: string
          user_id: string
        }
        Update: {
          imported_at?: string
          legacy_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          contact_email: string
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          items: Json
          legacy_id: string | null
          reference: string
          shipping_address: Json
          shipping_status: string
          status: string
          status_history: Json
          subtotal: number
          tax_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          items?: Json
          legacy_id?: string | null
          reference: string
          shipping_address?: Json
          shipping_status?: string
          status?: string
          status_history?: Json
          subtotal?: number
          tax_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          items?: Json
          legacy_id?: string | null
          reference?: string
          shipping_address?: Json
          shipping_status?: string
          status?: string
          status_history?: Json
          subtotal?: number
          tax_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string
          category_id: string | null
          category_label: string
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string
          id: string
          images: Json
          ingredients: string
          is_active: boolean
          is_demo: boolean
          is_published: boolean
          legacy_id: string | null
          low_stock_threshold: number
          name: string
          price: number
          purchase_available: boolean
          slug: string
          sort_order: number
          specifications: Json
          stock_by_variant: Json
          updated_at: string
          usage: string
          variants: Json
        }
        Insert: {
          badge?: string
          category_id?: string | null
          category_label?: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          images?: Json
          ingredients?: string
          is_active?: boolean
          is_demo?: boolean
          is_published?: boolean
          legacy_id?: string | null
          low_stock_threshold?: number
          name: string
          price?: number
          purchase_available?: boolean
          slug: string
          sort_order?: number
          specifications?: Json
          stock_by_variant?: Json
          updated_at?: string
          usage?: string
          variants?: Json
        }
        Update: {
          badge?: string
          category_id?: string | null
          category_label?: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string
          id?: string
          images?: Json
          ingredients?: string
          is_active?: boolean
          is_demo?: boolean
          is_published?: boolean
          legacy_id?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          purchase_available?: boolean
          slug?: string
          sort_order?: number
          specifications?: Json
          stock_by_variant?: Json
          updated_at?: string
          usage?: string
          variants?: Json
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      wishlists: {
        Row: {
          created_at: string
          product_ids: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_ids?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_ids?: Json
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
      adjust_product_inventory: {
        Args: {
          p_action: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_variant_id: string
        }
        Returns: {
          action: string
          adjustment_amount: number
          adjustment_id: string
          created_at: string
          new_quantity: number
          previous_quantity: number
          reason: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_order_status: {
        Args: { p_order_id: string; p_status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
