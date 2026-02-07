-- Adiciona colunas de localização na tabela marcacoes para o admin consultar
ALTER TABLE public.marcacoes
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS precisao_metros DECIMAL(8, 2);

COMMENT ON COLUMN public.marcacoes.latitude IS 'Latitude no momento do registro (opcional)';
COMMENT ON COLUMN public.marcacoes.longitude IS 'Longitude no momento do registro (opcional)';
COMMENT ON COLUMN public.marcacoes.precisao_metros IS 'Precisão do GPS em metros (opcional)';
