-- Corrige recursão: a política "Admin vê todos da facção" usava
-- EXISTS (SELECT FROM usuarios) dentro da própria política, causando recursão
-- e erro 500. Usar apenas is_admin_faccao (SECURITY DEFINER, não dispara RLS).

DROP POLICY IF EXISTS "Admin vê todos da facção" ON public.usuarios;

CREATE POLICY "Admin vê todos da facção"
  ON public.usuarios FOR SELECT
  USING (public.is_admin_faccao(faccao_id));
