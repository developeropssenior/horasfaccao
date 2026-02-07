-- Corrige conflito: a política ALL incluía INSERT com is_admin_faccao(id),
-- que falha para facção nova (ainda não há admin). Separamos INSERT das demais operações.

DROP POLICY IF EXISTS "Admin pode ver e editar sua facção" ON public.faccoes;

CREATE POLICY "Admin pode ver e editar sua facção"
  ON public.faccoes FOR SELECT
  USING (public.is_admin_faccao(id));

CREATE POLICY "Admin pode atualizar sua facção"
  ON public.faccoes FOR UPDATE
  USING (public.is_admin_faccao(id))
  WITH CHECK (public.is_admin_faccao(id));
