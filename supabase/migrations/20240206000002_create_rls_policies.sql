
-- Função auxiliar para obter o usuario logado
CREATE OR REPLACE FUNCTION public.get_usuario_logado()
RETURNS public.usuarios AS $$
  SELECT u.* FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função para verificar se é admin da facção
CREATE OR REPLACE FUNCTION public.is_admin_faccao(faccao_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE auth_user_id = auth.uid()
    AND faccao_id = faccao_uuid
    AND tipo = 'admin'
    AND ativo = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função para obter faccao_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_faccao_id_usuario()
RETURNS UUID AS $$
  SELECT faccao_id FROM public.usuarios
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS para faccoes
ALTER TABLE public.faccoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver e editar sua facção"
  ON public.faccoes FOR ALL
  USING (public.is_admin_faccao(id))
  WITH CHECK (public.is_admin_faccao(id));

-- Permitir insert na criação da facção (usuário autenticado)
CREATE POLICY "Usuário autenticado pode criar facção"
  ON public.faccoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS para usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todos da facção"
  ON public.usuarios FOR SELECT
  USING (
    public.get_faccao_id_usuario() = faccao_id
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = auth.uid() AND u.tipo = 'admin'
    )
  );

CREATE POLICY "Funcionário vê apenas a si mesmo"
  ON public.usuarios FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admin pode inserir funcionários"
  ON public.usuarios FOR INSERT
  WITH CHECK (
    public.is_admin_faccao(faccao_id)
    AND tipo = 'funcionario'
  );

CREATE POLICY "Admin pode atualizar funcionários da facção"
  ON public.usuarios FOR UPDATE
  USING (public.is_admin_faccao(faccao_id))
  WITH CHECK (public.is_admin_faccao(faccao_id));

-- Usuário pode inserir seu próprio registro (no registro de facção)
CREATE POLICY "Inserir usuario no registro"
  ON public.usuarios FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- RLS para marcacoes
ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê todas as marcações da facção"
  ON public.marcacoes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      JOIN public.usuarios m ON m.id = marcacoes.usuario_id
      WHERE u.auth_user_id = auth.uid()
      AND u.tipo = 'admin'
      AND u.faccao_id = m.faccao_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      JOIN public.usuarios m ON m.id = marcacoes.usuario_id
      WHERE u.auth_user_id = auth.uid()
      AND u.tipo = 'admin'
      AND u.faccao_id = m.faccao_id
    )
  );

CREATE POLICY "Funcionário vê suas próprias marcações"
  ON public.marcacoes FOR SELECT
  USING (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Funcionário pode inserir suas marcações"
  ON public.marcacoes FOR INSERT
  WITH CHECK (
    usuario_id IN (
      SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
    )
  );

-- RLS para periodos
ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia períodos"
  ON public.periodos FOR ALL
  USING (public.is_admin_faccao(faccao_id))
  WITH CHECK (public.is_admin_faccao(faccao_id));

-- RLS para folhas_pagamento
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia folhas"
  ON public.folhas_pagamento FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.periodos p
      WHERE p.id = periodo_id
      AND public.is_admin_faccao(p.faccao_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.periodos p
      WHERE p.id = periodo_id
      AND public.is_admin_faccao(p.faccao_id)
    )
  );
