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
      generated_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          property_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          template_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          property_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          template_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_tasks_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tasks_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tasks_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_costs_records: {
        Row: {
          allocation_key: Database["public"]["Enums"]["allocation_key"]
          amount: number
          billing_period_end: string
          billing_period_start: string
          cost_type: Database["public"]["Enums"]["operating_cost_type"]
          created_at: string
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_apportionable: boolean
          notes: string | null
          property_id: string
          receipt_url: string | null
          unit_id: string | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount: number
          billing_period_end: string
          billing_period_start: string
          cost_type: Database["public"]["Enums"]["operating_cost_type"]
          created_at?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_apportionable?: boolean
          notes?: string | null
          property_id: string
          receipt_url?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          cost_type?: Database["public"]["Enums"]["operating_cost_type"]
          created_at?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_apportionable?: boolean
          notes?: string | null
          property_id?: string
          receipt_url?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operating_costs_records_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_costs_records_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operating_costs_records_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          build_year: number | null
          city: string
          country: string
          created_at: string
          house_number: string
          id: string
          name: string
          notes: string | null
          street: string
          total_living_area: number | null
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          build_year?: number | null
          city: string
          country?: string
          created_at?: string
          house_number: string
          id?: string
          name: string
          notes?: string | null
          street: string
          total_living_area?: number | null
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          build_year?: number | null
          city?: string
          country?: string
          created_at?: string
          house_number?: string
          id?: string
          name?: string
          notes?: string | null
          street?: string
          total_living_area?: number | null
          updated_at?: string
          user_id?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          created_at: string
          day_of_month: number | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["task_interval"]
          is_active: boolean
          lead_time_days: number
          month_of_year: number | null
          next_run_at: string | null
          property_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          id?: string
          interval: Database["public"]["Enums"]["task_interval"]
          is_active?: boolean
          lead_time_days?: number
          month_of_year?: number | null
          next_run_at?: string | null
          property_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["task_interval"]
          is_active?: boolean
          lead_time_days?: number
          month_of_year?: number | null
          next_run_at?: string | null
          property_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cold_rent: number
          created_at: string
          deposit_amount: number
          deposit_paid: boolean
          deposit_type: Database["public"]["Enums"]["deposit_type"]
          email: string | null
          first_name: string
          heating_costs_advance: number
          iban: string | null
          id: string
          last_name: string
          move_in_date: string
          move_out_date: string | null
          notes: string | null
          operating_costs_advance: number
          persons_count: number
          phone: string | null
          rent_due_day: number
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cold_rent: number
          created_at?: string
          deposit_amount?: number
          deposit_paid?: boolean
          deposit_type?: Database["public"]["Enums"]["deposit_type"]
          email?: string | null
          first_name: string
          heating_costs_advance?: number
          iban?: string | null
          id?: string
          last_name: string
          move_in_date: string
          move_out_date?: string | null
          notes?: string | null
          operating_costs_advance?: number
          persons_count?: number
          phone?: string | null
          rent_due_day?: number
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cold_rent?: number
          created_at?: string
          deposit_amount?: number
          deposit_paid?: boolean
          deposit_type?: Database["public"]["Enums"]["deposit_type"]
          email?: string | null
          first_name?: string
          heating_costs_advance?: number
          iban?: string | null
          id?: string
          last_name?: string
          move_in_date?: string
          move_out_date?: string | null
          notes?: string | null
          operating_costs_advance?: number
          persons_count?: number
          phone?: string | null
          rent_due_day?: number
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          floor: string | null
          id: string
          label: string
          living_area: number | null
          notes: string | null
          ownership_share: number | null
          property_id: string
          rooms: number | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          id?: string
          label: string
          living_area?: number | null
          notes?: string | null
          ownership_share?: number | null
          property_id: string
          rooms?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          id?: string
          label?: string
          living_area?: number | null
          notes?: string | null
          ownership_share?: number | null
          property_id?: string
          rooms?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          iban: string | null
          id: string
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          stripe_customer_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          iban?: string | null
          id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          iban?: string | null
          id?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
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
      allocation_key:
        | "living_area"
        | "persons"
        | "units"
        | "consumption"
        | "ownership_share"
        | "direct"
      deposit_type:
        | "cash_deposit"
        | "bank_guarantee"
        | "deposit_insurance"
        | "pledged_savings"
        | "none"
      operating_cost_type:
        | "property_tax"
        | "water_supply"
        | "drainage"
        | "heating"
        | "hot_water"
        | "elevator"
        | "street_cleaning"
        | "waste_disposal"
        | "building_cleaning"
        | "garden_maintenance"
        | "lighting"
        | "chimney_sweep"
        | "insurance"
        | "caretaker"
        | "cable_tv_internet"
        | "laundry_facilities"
        | "other_operating_costs"
        | "non_apportionable"
      subscription_plan: "free" | "starter" | "pro" | "business"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
      task_interval:
        | "once"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semiannually"
        | "yearly"
      task_status: "open" | "done" | "overdue"
      unit_type: "residential" | "commercial" | "parking" | "other"
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
      allocation_key: [
        "living_area",
        "persons",
        "units",
        "consumption",
        "ownership_share",
        "direct",
      ],
      deposit_type: [
        "cash_deposit",
        "bank_guarantee",
        "deposit_insurance",
        "pledged_savings",
        "none",
      ],
      operating_cost_type: [
        "property_tax",
        "water_supply",
        "drainage",
        "heating",
        "hot_water",
        "elevator",
        "street_cleaning",
        "waste_disposal",
        "building_cleaning",
        "garden_maintenance",
        "lighting",
        "chimney_sweep",
        "insurance",
        "caretaker",
        "cable_tv_internet",
        "laundry_facilities",
        "other_operating_costs",
        "non_apportionable",
      ],
      subscription_plan: ["free", "starter", "pro", "business"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
      ],
      task_interval: [
        "once",
        "weekly",
        "monthly",
        "quarterly",
        "semiannually",
        "yearly",
      ],
      task_status: ["open", "done", "overdue"],
      unit_type: ["residential", "commercial", "parking", "other"],
    },
  },
} as const

