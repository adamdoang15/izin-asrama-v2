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
      users: {
        Row: {
          id: number
          username: string
          password_hash: string
          name: string
          role: "SANTRI" | "PENGURUS"
          kamar: string | null
          is_active: boolean
          is_blacklisted: boolean
          blacklist_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          username: string
          password_hash: string
          name: string
          role: "SANTRI" | "PENGURUS"
          kamar?: string | null
          is_active?: boolean
          is_blacklisted?: boolean
          blacklist_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          username?: string
          password_hash?: string
          name?: string
          role?: "SANTRI" | "PENGURUS"
          kamar?: string | null
          is_active?: boolean
          is_blacklisted?: boolean
          blacklist_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      izin: {
        Row: {
          id: number
          user_id: number
          jenis_izin: "HARIAN" | "MENGINAP" | "REKREASI" | "KELUARGA" | "DARURAT"
          alasan: string
          tujuan: string
          tanggal_keluar: string
          perkiraan_kembali: string
          status: "MENUNGGU" | "PERLU_REVISI" | "DISETUJUI" | "DITOLAK" | "SEDANG_KELUAR" | "SUDAH_KEMBALI" | "TIDAK_JADI"
          catatan_admin: string | null
          approved_by: number | null
          approved_at: string | null
          returned_at: string | null
          return_status: "TEPAT_WAKTU" | "TERLAMBAT" | null
          late_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: number
          jenis_izin?: "HARIAN" | "MENGINAP" | "REKREASI" | "KELUARGA" | "DARURAT"
          alasan: string
          tujuan: string
          tanggal_keluar: string
          perkiraan_kembali: string
          status?: "MENUNGGU" | "PERLU_REVISI" | "DISETUJUI" | "DITOLAK" | "SEDANG_KELUAR" | "SUDAH_KEMBALI" | "TIDAK_JADI"
          catatan_admin?: string | null
          approved_by?: number | null
          approved_at?: string | null
          returned_at?: string | null
          return_status?: "TEPAT_WAKTU" | "TERLAMBAT" | null
          late_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          jenis_izin?: "HARIAN" | "MENGINAP" | "REKREASI" | "KELUARGA" | "DARURAT"
          alasan?: string
          tujuan?: string
          tanggal_keluar?: string
          perkiraan_kembali?: string
          status?: "MENUNGGU" | "PERLU_REVISI" | "DISETUJUI" | "DITOLAK" | "SEDANG_KELUAR" | "SUDAH_KEMBALI" | "TIDAK_JADI"
          catatan_admin?: string | null
          approved_by?: number | null
          approved_at?: string | null
          returned_at?: string | null
          return_status?: "TEPAT_WAKTU" | "TERLAMBAT" | null
          late_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "izin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "izin_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      izin_logs: {
        Row: {
          id: number
          izin_id: number
          actor_id: number | null
          action: string
          old_status: string | null
          new_status: string | null
          catatan: string | null
          data_sebelum: Json | null
          data_sesudah: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          izin_id: number
          actor_id?: number | null
          action: string
          old_status?: string | null
          new_status?: string | null
          catatan?: string | null
          data_sebelum?: Json | null
          data_sesudah?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          izin_id?: number
          actor_id?: number | null
          action?: string
          old_status?: string | null
          new_status?: string | null
          catatan?: string | null
          data_sebelum?: Json | null
          data_sesudah?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "izin_logs_izin_id_fkey"
            columns: ["izin_id"]
            isOneToOne: false
            referencedRelation: "izin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "izin_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: number
          user_id: number
          endpoint: string
          auth: string
          p256dh: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: number
          endpoint: string
          auth: string
          p256dh: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          endpoint?: string
          auth?: string
          p256dh?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
