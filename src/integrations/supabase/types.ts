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
      customers: {
        Row: {
          created_at: string
          customer_name: string
          id: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
        }
        Relationships: []
      }
      Pelanggan: {
        Row: {
          created_at: string | null
          id: string
          kontak: string | null
          namaPelanggan: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          kontak?: string | null
          namaPelanggan: string
        }
        Update: {
          created_at?: string | null
          id?: string
          kontak?: string | null
          namaPelanggan?: string
        }
        Relationships: []
      }
      Penjualan: {
        Row: {
          created_at: string | null
          id: string
          jumlahTerjual: number
          pelanggan_id: string | null
          produk_id: string | null
          statusPembayaran: string
          totalKeuntungan: number
          totalModal: number
          totalPendapatan: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          jumlahTerjual: number
          pelanggan_id?: string | null
          produk_id?: string | null
          statusPembayaran?: string
          totalKeuntungan: number
          totalModal: number
          totalPendapatan: number
        }
        Update: {
          created_at?: string | null
          id?: string
          jumlahTerjual?: number
          pelanggan_id?: string | null
          produk_id?: string | null
          statusPembayaran?: string
          totalKeuntungan?: number
          totalModal?: number
          totalPendapatan?: number
        }
        Relationships: [
          {
            foreignKeyName: "Penjualan_pelanggan_id_fkey"
            columns: ["pelanggan_id"]
            isOneToOne: false
            referencedRelation: "Pelanggan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Penjualan_produk_id_fkey"
            columns: ["produk_id"]
            isOneToOne: false
            referencedRelation: "Produk"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          current_stock: number
          id: string
          initial_stock: number
          product_name: string
          purchase_price: number
          selling_price: number
        }
        Insert: {
          created_at?: string
          current_stock: number
          id: string
          initial_stock: number
          product_name: string
          purchase_price: number
          selling_price: number
        }
        Update: {
          created_at?: string
          current_stock?: number
          id?: string
          initial_stock?: number
          product_name?: string
          purchase_price?: number
          selling_price?: number
        }
        Relationships: []
      }
      Produk: {
        Row: {
          created_at: string | null
          hargaBeli: number
          hargaJual: number
          id: string
          namaProduk: string
          stokSaatIni: number
        }
        Insert: {
          created_at?: string | null
          hargaBeli: number
          hargaJual: number
          id?: string
          namaProduk: string
          stokSaatIni: number
        }
        Update: {
          created_at?: string | null
          hargaBeli?: number
          hargaJual?: number
          id?: string
          namaProduk?: string
          stokSaatIni?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          customer_id: string | null
          id: string
          payment_status: string
          product_id: string
          quantity_sold: number
          sale_timestamp: string
          total_cost: number
          total_profit: number
          total_revenue: number
        }
        Insert: {
          customer_id?: string | null
          id?: string
          payment_status?: string
          product_id: string
          quantity_sold: number
          sale_timestamp?: string
          total_cost: number
          total_profit: number
          total_revenue: number
        }
        Update: {
          customer_id?: string | null
          id?: string
          payment_status?: string
          product_id?: string
          quantity_sold?: number
          sale_timestamp?: string
          total_cost?: number
          total_profit?: number
          total_revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_sale: {
        Args: {
          p_produk_id: string
          p_jumlah_terjual: number
          p_status_pembayaran: string
          p_pelanggan_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
