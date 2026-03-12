export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      group_memberships: {
        Row: {
          group_id: string
          user_id: string
          is_owner: boolean
          can_read: boolean
          can_write: boolean
          can_admin: boolean
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          is_owner?: boolean
          can_read?: boolean
          can_write?: boolean
          can_admin?: boolean
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          is_owner?: boolean
          can_read?: boolean
          can_write?: boolean
          can_admin?: boolean
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'group_memberships_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          }
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          visibility: 'public' | 'private'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
          is_ai_message: boolean
          is_private: boolean
          requester_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          has_ai_response: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
          is_ai_message?: boolean
          is_private?: boolean
          requester_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          has_ai_response?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
          is_ai_message?: boolean
          is_private?: boolean
          requester_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          has_ai_response?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'messages_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          kind: 'group' | 'personal'
          group_id: string | null
          visibility: 'public' | 'private'
          created_by: string | null
          owner_user_id: string | null
          ai_enabled: boolean
          ai_model: string | null
          created_at: string
          last_activity_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          kind?: 'group' | 'personal'
          group_id?: string | null
          visibility?: 'public' | 'private'
          created_by?: string | null
          owner_user_id?: string | null
          ai_enabled?: boolean
          ai_model?: string | null
          created_at?: string
          last_activity_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          kind?: 'group' | 'personal'
          group_id?: string | null
          visibility?: 'public' | 'private'
          created_by?: string | null
          owner_user_id?: string | null
          ai_enabled?: boolean
          ai_model?: string | null
          created_at?: string
          last_activity_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rooms_group_id_fkey'
            columns: ['group_id']
            isOneToOne: false
            referencedRelation: 'groups'
            referencedColumns: ['id']
          }
        ]
      }
      room_memberships: {
        Row: {
          room_id: string
          user_id: string
          added_by: string | null
          added_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          added_by?: string | null
          added_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          added_by?: string | null
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'room_memberships_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      user_ai_personalization_settings: {
        Row: {
          user_id: string
          base_style_tone:
            | 'default'
            | 'professional'
            | 'friendly'
            | 'candid'
            | 'quirky'
            | 'efficient'
            | 'nerdy'
            | 'cynical'
          response_detail_mode: 'default' | 'short' | 'detailed' | 'structured'
          warm: 'default' | 'subtle' | 'strong'
          enthusiastic: 'default' | 'subtle' | 'strong'
          headers_and_lists: 'default' | 'subtle' | 'strong'
          emoji: 'default' | 'subtle' | 'strong'
          custom_instructions: string
          about_you: string
          updated_at: string
        }
        Insert: {
          user_id: string
          base_style_tone?:
            | 'default'
            | 'professional'
            | 'friendly'
            | 'candid'
            | 'quirky'
            | 'efficient'
            | 'nerdy'
            | 'cynical'
          response_detail_mode?: 'default' | 'short' | 'detailed' | 'structured'
          warm?: 'default' | 'subtle' | 'strong'
          enthusiastic?: 'default' | 'subtle' | 'strong'
          headers_and_lists?: 'default' | 'subtle' | 'strong'
          emoji?: 'default' | 'subtle' | 'strong'
          custom_instructions?: string
          about_you?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          base_style_tone?:
            | 'default'
            | 'professional'
            | 'friendly'
            | 'candid'
            | 'quirky'
            | 'efficient'
            | 'nerdy'
            | 'cynical'
          response_detail_mode?: 'default' | 'short' | 'detailed' | 'structured'
          warm?: 'default' | 'subtle' | 'strong'
          enthusiastic?: 'default' | 'subtle' | 'strong'
          headers_and_lists?: 'default' | 'subtle' | 'strong'
          emoji?: 'default' | 'subtle' | 'strong'
          custom_instructions?: string
          about_you?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_ai_usage_buckets: {
        Row: {
          user_id: string
          window_kind: 'five_hour' | 'monthly'
          window_start: string
          tokens_used: number
          updated_at: string
        }
        Insert: {
          user_id: string
          window_kind: 'five_hour' | 'monthly'
          window_start: string
          tokens_used?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          window_kind?: 'five_hour' | 'monthly'
          window_start?: string
          tokens_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_ai_file_contexts: {
        Row: {
          id: string
          room_id: string
          user_id: string
          created_at: string
          expires_at: string
          consumed_at: string | null
          accepted_files: Json
          warnings: Json
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          created_at?: string
          expires_at: string
          consumed_at?: string | null
          accepted_files?: Json
          warnings?: Json
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          created_at?: string
          expires_at?: string
          consumed_at?: string | null
          accepted_files?: Json
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'user_ai_file_contexts_room_id_fkey'
            columns: ['room_id']
            isOneToOne: false
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      user_ai_file_processing_buckets: {
        Row: {
          user_id: string
          window_start: string
          request_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          window_start: string
          request_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          window_start?: string
          request_count?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_room: {
        Args: {
          viewer_uuid: string | null
          room_uuid: string
        }
        Returns: boolean
      }
      can_write_room: {
        Args: {
          viewer_uuid: string | null
          room_uuid: string
        }
        Returns: boolean
      }
      get_chat_user_profiles: {
        Args: {
          user_ids: string[]
        }
        Returns: {
          user_id: string
          display_name: string
          avatar_url: string | null
          email: string | null
          last_seen_at: string | null
        }[]
      }
      get_user_display_name: {
        Args: {
          user_uuid: string
        }
        Returns: string
      }
      increment_ai_usage_bucket: {
        Args: {
          usage_user_id: string
          usage_window_kind: 'five_hour' | 'monthly'
          usage_window_start: string
          token_delta: number
        }
        Returns: number
      }
      increment_ai_file_processing_bucket: {
        Args: {
          processing_user_id: string
          processing_window_start: string
          request_delta: number
        }
        Returns: number
      }
      search_chat_users: {
        Args: {
          viewer_uuid: string | null
          search_query?: string | null
          max_results?: number | null
        }
        Returns: {
          user_id: string
          display_name: string
          avatar_url: string | null
          email: string | null
          last_seen_at: string | null
        }[]
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
