-- Tabela faccoes
CREATE TABLE IF NOT EXISTS public.faccoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela usuarios (vinculada a auth.users)
-- auth.users é gerenciada pelo Supabase Auth
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faccao_id UUID NOT NULL REFERENCES public.faccoes(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'funcionario')),
  valor_hora DECIMAL(10, 2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_faccao ON public.usuarios(faccao_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user ON public.usuarios(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON public.usuarios(tipo);

-- Tabela marcacoes
CREATE TABLE IF NOT EXISTS public.marcacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  editado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marcacoes_usuario ON public.marcacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_data_hora ON public.marcacoes(data_hora);

-- Tabela periodos
CREATE TABLE IF NOT EXISTS public.periodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faccao_id UUID NOT NULL REFERENCES public.faccoes(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  fechado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_periodos_faccao ON public.periodos(faccao_id);

-- Tabela folhas_pagamento
CREATE TABLE IF NOT EXISTS public.folhas_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id UUID NOT NULL REFERENCES public.periodos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  total_horas DECIMAL(10, 2) NOT NULL,
  valor_hora DECIMAL(10, 2) NOT NULL,
  total_pagar DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folhas_periodo ON public.folhas_pagamento(periodo_id);

-- Habilitar Realtime nas tabelas marcacoes e folhas_pagamento
ALTER PUBLICATION supabase_realtime ADD TABLE public.marcacoes;
