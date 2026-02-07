export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      faccoes: {
        Row: {
          id: string;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          created_at?: string;
        };
      };
      usuarios: {
        Row: {
          id: string;
          faccao_id: string;
          auth_user_id: string;
          nome: string;
          email: string;
          tipo: 'admin' | 'funcionario';
          valor_hora: number;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          faccao_id: string;
          auth_user_id: string;
          nome: string;
          email: string;
          tipo: 'admin' | 'funcionario';
          valor_hora?: number;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          faccao_id?: string;
          auth_user_id?: string;
          nome?: string;
          email?: string;
          tipo?: 'admin' | 'funcionario';
          valor_hora?: number;
          ativo?: boolean;
          created_at?: string;
        };
      };
      marcacoes: {
        Row: {
          id: string;
          usuario_id: string;
          data_hora: string;
          tipo: 'entrada' | 'saida';
          editado_por: string | null;
          latitude: number | null;
          longitude: number | null;
          precisao_metros: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          usuario_id: string;
          data_hora?: string;
          tipo: 'entrada' | 'saida';
          editado_por?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          precisao_metros?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string;
          data_hora?: string;
          tipo?: 'entrada' | 'saida';
          editado_por?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          precisao_metros?: number | null;
          created_at?: string;
        };
      };
      periodos: {
        Row: {
          id: string;
          faccao_id: string;
          data_inicio: string;
          data_fim: string;
          fechado: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          faccao_id: string;
          data_inicio: string;
          data_fim: string;
          fechado?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          faccao_id?: string;
          data_inicio?: string;
          data_fim?: string;
          fechado?: boolean;
          created_at?: string;
        };
      };
      folhas_pagamento: {
        Row: {
          id: string;
          periodo_id: string;
          usuario_id: string;
          total_horas: number;
          valor_hora: number;
          total_pagar: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          periodo_id: string;
          usuario_id: string;
          total_horas: number;
          valor_hora: number;
          total_pagar: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          periodo_id?: string;
          usuario_id?: string;
          total_horas?: number;
          valor_hora?: number;
          total_pagar?: number;
          created_at?: string;
        };
      };
    };
  };
}

export type Faccao = Database['public']['Tables']['faccoes']['Row'];
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type Marcacao = Database['public']['Tables']['marcacoes']['Row'];
export type Periodo = Database['public']['Tables']['periodos']['Row'];
export type FolhaPagamento = Database['public']['Tables']['folhas_pagamento']['Row'];
