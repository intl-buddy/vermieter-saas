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
      account_links: {
        Row: {
          granted_at: string
          id: string
          manager_email: string
          manager_user_id: string | null
          owner_user_id: string
          revoked_at: string | null
          status: Database["public"]["Enums"]["account_link_status"]
        }
        Insert: {
          granted_at?: string
          id?: string
          manager_email?: string
          manager_user_id?: string | null
          owner_user_id: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["account_link_status"]
        }
        Update: {
          granted_at?: string
          id?: string
          manager_email?: string
          manager_user_id?: string | null
          owner_user_id?: string
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["account_link_status"]
        }
        Relationships: [
          {
            foreignKeyName: "account_links_owner_user_id_fkey"
            columns: ["owner_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_links_manager_user_id_fkey"
            columns: ["manager_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      management_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["management_inquiry_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["management_inquiry_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["management_inquiry_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_inquiries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_runs: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          property_id: string
          status: Database["public"]["Enums"]["billing_run_status"]
          tenant_count: number | null
          total_costs: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          property_id: string
          status?: Database["public"]["Enums"]["billing_run_status"]
          tenant_count?: number | null
          total_costs?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          property_id?: string
          status?: Database["public"]["Enums"]["billing_run_status"]
          tenant_count?: number | null
          total_costs?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_runs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_statements: {
        Row: {
          balance: number
          billing_run_id: string
          created_at: string
          heating_costs: number
          id: string
          labor_35a_craftsman: number
          labor_35a_household: number
          line_items: Json
          messdienst_pdf_url: string | null
          occupancy_days: number | null
          occupancy_end: string | null
          occupancy_start: string | null
          pdf_url: string | null
          prepayments_heating: number
          prepayments_operating: number
          prepayments_source: string
          tenant_id: string
          total_35a_craftsman: number
          total_35a_household: number
          total_share: number
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance: number
          billing_run_id: string
          created_at?: string
          heating_costs?: number
          id?: string
          labor_35a_craftsman?: number
          labor_35a_household?: number
          line_items: Json
          messdienst_pdf_url?: string | null
          occupancy_days?: number | null
          occupancy_end?: string | null
          occupancy_start?: string | null
          pdf_url?: string | null
          prepayments_heating?: number
          prepayments_operating?: number
          prepayments_source?: string
          tenant_id: string
          total_35a_craftsman?: number
          total_35a_household?: number
          total_share: number
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          billing_run_id?: string
          created_at?: string
          heating_costs?: number
          id?: string
          labor_35a_craftsman?: number
          labor_35a_household?: number
          line_items?: Json
          messdienst_pdf_url?: string | null
          occupancy_days?: number | null
          occupancy_end?: string | null
          occupancy_start?: string | null
          pdf_url?: string | null
          prepayments_heating?: number
          prepayments_operating?: number
          prepayments_source?: string
          tenant_id?: string
          total_35a_craftsman?: number
          total_35a_household?: number
          total_share?: number
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_statements_billing_run_id_fkey"
            columns: ["billing_run_id"]
            referencedRelation: "billing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenant_balances"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "billing_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_statements_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_statements_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_log: {
        Row: {
          deleted_at: string
          id: string
          user_id_hash: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          user_id_hash: string
        }
        Update: {
          deleted_at?: string
          id?: string
          user_id_hash?: string
        }
        Relationships: []
      }
      dunning_letters: {
        Row: {
          amount_due: number
          covered_periods: string[]
          created_at: string
          fee: number
          id: string
          issued_at: string
          level: number
          notes: string | null
          payment_deadline: string
          pdf_url: string | null
          status: Database["public"]["Enums"]["dunning_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due: number
          covered_periods?: string[]
          created_at?: string
          fee?: number
          id?: string
          issued_at?: string
          level: number
          notes?: string | null
          payment_deadline: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["dunning_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          covered_periods?: string[]
          created_at?: string
          fee?: number
          id?: string
          issued_at?: string
          level?: number
          notes?: string | null
          payment_deadline?: string
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["dunning_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dunning_letters_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenant_balances"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "dunning_letters_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dunning_letters_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
      handover_protocols: {
        Row: {
          created_at: string
          id: string
          keys: Json
          meter_readings: Json
          notes: string | null
          pdf_url: string | null
          protocol_date: string
          rooms: Json
          signature_landlord: string | null
          signature_tenant: string | null
          status: Database["public"]["Enums"]["handover_status"]
          tenant_email: string | null
          tenant_id: string | null
          tenant_name: string
          type: Database["public"]["Enums"]["handover_type"]
          unit_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keys?: Json
          meter_readings?: Json
          notes?: string | null
          pdf_url?: string | null
          protocol_date?: string
          rooms?: Json
          signature_landlord?: string | null
          signature_tenant?: string | null
          status?: Database["public"]["Enums"]["handover_status"]
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string
          type: Database["public"]["Enums"]["handover_type"]
          unit_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keys?: Json
          meter_readings?: Json
          notes?: string | null
          pdf_url?: string | null
          protocol_date?: string
          rooms?: Json
          signature_landlord?: string | null
          signature_tenant?: string | null
          status?: Database["public"]["Enums"]["handover_status"]
          tenant_email?: string | null
          tenant_id?: string | null
          tenant_name?: string
          type?: Database["public"]["Enums"]["handover_type"]
          unit_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_protocols_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_protocols_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_protocols_user_id_fkey"
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
          gross_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_apportionable: boolean
          labor_cost_35a: number | null
          notes: string | null
          paid_date: string | null
          property_id: string
          receipt_url: string | null
          tenant_id: string | null
          type_35a: Database["public"]["Enums"]["category_35a"] | null
          unit_id: string | null
          updated_at: string
          user_id: string
          vat_rate: number | null
          vendor: string | null
        }
        Insert: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount: number
          billing_period_end: string
          billing_period_start: string
          cost_type: Database["public"]["Enums"]["operating_cost_type"]
          created_at?: string
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_apportionable?: boolean
          labor_cost_35a?: number | null
          notes?: string | null
          paid_date?: string | null
          property_id: string
          receipt_url?: string | null
          tenant_id?: string | null
          type_35a?: Database["public"]["Enums"]["category_35a"] | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
          vat_rate?: number | null
          vendor?: string | null
        }
        Update: {
          allocation_key?: Database["public"]["Enums"]["allocation_key"]
          amount?: number
          billing_period_end?: string
          billing_period_start?: string
          cost_type?: Database["public"]["Enums"]["operating_cost_type"]
          created_at?: string
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_apportionable?: boolean
          labor_cost_35a?: number | null
          notes?: string | null
          paid_date?: string | null
          property_id?: string
          receipt_url?: string | null
          tenant_id?: string | null
          type_35a?: Database["public"]["Enums"]["category_35a"] | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
          vat_rate?: number | null
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
            foreignKeyName: "operating_costs_records_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
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
          rent_iban: string | null
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
          rent_iban?: string | null
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
          rent_iban?: string | null
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
      rent_charges: {
        Row: {
          cold_rent: number
          created_at: string
          due_date: string
          heating_costs_advance: number
          id: string
          notes: string | null
          operating_costs_advance: number
          period: string
          source: Database["public"]["Enums"]["charge_source"]
          tenant_id: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cold_rent?: number
          created_at?: string
          due_date: string
          heating_costs_advance?: number
          id?: string
          notes?: string | null
          operating_costs_advance?: number
          period: string
          source?: Database["public"]["Enums"]["charge_source"]
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cold_rent?: number
          created_at?: string
          due_date?: string
          heating_costs_advance?: number
          id?: string
          notes?: string | null
          operating_costs_advance?: number
          period?: string
          source?: Database["public"]["Enums"]["charge_source"]
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_charges_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenant_balances"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rent_charges_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_charges_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_payments: {
        Row: {
          amount: number
          bank_reference: string | null
          created_at: string
          id: string
          import_hash: string | null
          notes: string | null
          paid_at: string
          payer: Database["public"]["Enums"]["payer_type"]
          source: Database["public"]["Enums"]["payment_source"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_reference?: string | null
          created_at?: string
          id?: string
          import_hash?: string | null
          notes?: string | null
          paid_at: string
          payer?: Database["public"]["Enums"]["payer_type"]
          source?: Database["public"]["Enums"]["payment_source"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_reference?: string | null
          created_at?: string
          id?: string
          import_hash?: string | null
          notes?: string | null
          paid_at?: string
          payer?: Database["public"]["Enums"]["payer_type"]
          source?: Database["public"]["Enums"]["payment_source"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenant_balances"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "rent_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_note: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
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
      tenant_person_periods: {
        Row: {
          created_at: string
          id: string
          persons_count: number
          tenant_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          persons_count: number
          tenant_id: string
          updated_at?: string
          user_id: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          persons_count?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_person_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenant_balances"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_person_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_person_periods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          advance_mode: string
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
          advance_mode?: string
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
          advance_mode?: string
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
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender: Database["public"]["Enums"]["ticket_sender"]
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender: Database["public"]["Enums"]["ticket_sender"]
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender?: Database["public"]["Enums"]["ticket_sender"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "support_tickets"
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
          access_until: string | null
          address_city: string | null
          address_street: string | null
          address_zip: string | null
          bank_name: string | null
          bic: string | null
          cancel_at_period_end: boolean
          company_name: string | null
          created_at: string
          current_period_end: string | null
          deleted_at: string | null
          deletion_warned_at: string | null
          dunning_deadline_days: number
          dunning_fee: number
          email: string
          full_name: string
          iban: string | null
          id: string
          is_admin: boolean
          onboarding_completed: boolean
          pdf_footer_enabled: boolean
          phone: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_id: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          terms_accepted_at: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          access_until?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank_name?: string | null
          bic?: string | null
          cancel_at_period_end?: boolean
          company_name?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          deletion_warned_at?: string | null
          dunning_deadline_days?: number
          dunning_fee?: number
          email: string
          full_name: string
          iban?: string | null
          id?: string
          is_admin?: boolean
          onboarding_completed?: boolean
          pdf_footer_enabled?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          terms_accepted_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          access_until?: string | null
          address_city?: string | null
          address_street?: string | null
          address_zip?: string | null
          bank_name?: string | null
          bic?: string | null
          cancel_at_period_end?: boolean
          company_name?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          deletion_warned_at?: string | null
          dunning_deadline_days?: number
          dunning_fee?: number
          email?: string
          full_name?: string
          iban?: string | null
          id?: string
          is_admin?: boolean
          onboarding_completed?: boolean
          pdf_footer_enabled?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          terms_accepted_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      tenant_balances: {
        Row: {
          balance: number | null
          first_name: string | null
          last_name: string | null
          tenant_id: string | null
          total_due: number | null
          total_paid: number | null
          unit_id: string | null
          user_id: string | null
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
    }
    Functions: {
      has_account_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      admin_list_management_inquiries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_set_inquiry_status: {
        Args: {
          p_inquiry_id: string
          p_status: Database["public"]["Enums"]["management_inquiry_status"]
        }
        Returns: undefined
      }
      my_managed_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          owner_user_id: string
          owner_name: string
          owner_email: string
          granted_at: string
        }[]
      }
      admin_feature_usage: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_funnel_stats: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_list_tickets: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_reply_ticket: {
        Args: { p_ticket_id: string; p_message: string }
        Returns: Json
      }
      admin_set_ticket_note: {
        Args: { p_ticket_id: string; p_note: string }
        Returns: undefined
      }
      admin_set_ticket_status: {
        Args: {
          p_ticket_id: string
          p_status: Database["public"]["Enums"]["ticket_status"]
        }
        Returns: undefined
      }
      admin_metrics_history: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_portfolio_distribution: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_revenue_stats: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_stats: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_stats_by_city: { Args: Record<PropertyKey, never>; Returns: Json }
      admin_sync_price_catalog: { Args: { p_entries: Json }; Returns: undefined }
      capture_admin_snapshot: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin_caller: { Args: Record<PropertyKey, never>; Returns: boolean }
      generate_monthly_charges: { Args: never; Returns: number }
      generate_tasks_from_templates: { Args: never; Returns: number }
      mark_overdue_tasks: { Args: never; Returns: number }
      missing_schema_columns: {
        Args: { expected: Json }
        Returns: {
          missing_column: string
          missing_table: string
        }[]
      }
      open_charges: {
        Args: { p_tenant_id: string }
        Returns: {
          charge_id: string
          due_date: string
          open_amount: number
          period: string
          total_amount: number
        }[]
      }
    }
    Enums: {
      account_link_status: "active" | "revoked"
      allocation_key:
        | "living_area"
        | "persons"
        | "units"
        | "consumption"
        | "ownership_share"
        | "direct"
      billing_run_status: "draft" | "finalized"
      category_35a: "household_services" | "craftsman_services"
      charge_source: "auto" | "manual"
      deposit_type:
        | "cash_deposit"
        | "bank_guarantee"
        | "deposit_insurance"
        | "pledged_savings"
        | "none"
      dunning_status: "draft" | "sent" | "resolved" | "obsolete"
      handover_status: "draft" | "completed"
      handover_type: "move_in" | "move_out"
      management_inquiry_status: "new" | "contacted" | "closed"
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
      payer_type: "tenant" | "jobcenter" | "other"
      payment_source: "manual" | "csv_import"
      subscription_plan:
        | "trial"
        | "bronze"
        | "silber"
        | "gold"
        | "platin"
        | "enterprise"
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
      ticket_category: "frage" | "problem" | "idee" | "abrechnung"
      ticket_sender: "user" | "admin"
      ticket_status: "open" | "in_progress" | "closed"
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
      billing_run_status: ["draft", "finalized"],
      category_35a: ["household_services", "craftsman_services"],
      charge_source: ["auto", "manual"],
      deposit_type: [
        "cash_deposit",
        "bank_guarantee",
        "deposit_insurance",
        "pledged_savings",
        "none",
      ],
      dunning_status: ["draft", "sent", "resolved", "obsolete"],
      handover_status: ["draft", "completed"],
      handover_type: ["move_in", "move_out"],
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
      payer_type: ["tenant", "jobcenter", "other"],
      payment_source: ["manual", "csv_import"],
      subscription_plan: [
        "trial",
        "bronze",
        "silber",
        "gold",
        "platin",
        "enterprise",
      ],
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
      ticket_category: ["frage", "problem", "idee", "abrechnung"],
      ticket_sender: ["user", "admin"],
      ticket_status: ["open", "in_progress", "closed"],
      unit_type: ["residential", "commercial", "parking", "other"],
    },
  },
} as const

