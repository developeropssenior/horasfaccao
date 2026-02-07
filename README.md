# Controle de Ponto - Facção de Costura

Sistema web responsivo de controle de ponto e folha de pagamento para facção de costura, usando Next.js e Supabase.

## Funcionalidades

- **Administrador**: Cadastro de facção, funcionários (com valor/hora), gestão de marcações, períodos, geração de folha de pagamento, relatórios
- **Funcionário**: Registro de ponto, visualização de marcações e total de horas
- **Realtime**: Atualização automática de marcações via Supabase Realtime

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## Instalação

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Crie um projeto no Supabase e execute as migrations em `supabase/migrations/` na ordem:

   - `20240206000001_create_schema.sql` - Cria as tabelas
   - `20240206000002_create_rls_policies.sql` - Configura RLS

3. Copie `.env.local.example` para `.env.local` e preencha com os valores do seu projeto Supabase (Settings > API):

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

   **Nota:** Para rodar `npm run build` sem projeto Supabase configurado, use valores placeholder (ex: `https://x.supabase.co` e `x`).

4. Execute o projeto:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Primeiro uso

1. Acesse `/registro-faccao` para cadastrar sua facção e criar a conta de administrador
2. Faça login e cadastre funcionários em "Funcionários"
3. Funcionários fazem login e registram ponto em `/funcionario`

## Notificação de Ponto Esquecido

A API `/api/admin/verificar-ponto-esquecido` verifica funcionários que não bateram ponto de saída no dia. Configure um cron job para chamá-la no fim do expediente:

- **Vercel Cron**: Adicione em `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/verificar-ponto-esquecido",
      "schedule": "0 21 * * 1-5"
    }
  ]
}
```

- Configure `CRON_SECRET` no ambiente e use `Authorization: Bearer <CRON_SECRET>` nas requisições.

- Integre com Resend ou outro serviço de email para enviar notificações aos funcionários retornados.

## Deploy no Netlify

1. **Conecte o repositório**
   - Acesse [app.netlify.com](https://app.netlify.com)
   - "Add new site" > "Import an existing project"
   - Conecte o Git (GitHub, GitLab ou Bitbucket) e selecione o repositório

2. **Configure as variáveis de ambiente** (obrigatório)
   - Site settings > Environment variables > Add a variable / Import from .env
   - Adicione **antes do primeiro deploy**:
     - `NEXT_PUBLIC_SUPABASE_URL` – URL do projeto Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Chave anônima
     - `SUPABASE_SERVICE_ROLE_KEY` – Service role key (para APIs admin)
     - `CRON_SECRET` – (opcional) Se usar cron externo para verificar ponto esquecido
   - Marque "Deploy contexts" como Production (e outros se necessário)

3. **Build**
   - Netlify detecta Next.js e configura o build automaticamente
   - Build command: `npm run build`
   - Node: 20 (configurado em `netlify.toml`)

4. **Testar localmente (opcional)**
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```

5. **Cron – Ponto esquecido**
   - O Netlify não oferece cron nativo para rotas API do Next.js
   - Use um serviço externo (ex: [cron-job.org](https://cron-job.org)) para chamar:
     ```
     GET https://seu-site.netlify.app/api/admin/verificar-ponto-esquecido
     Header: Authorization: Bearer <CRON_SECRET>
     ```
   - Sugestão de horário: 21h (9pm) de segunda a sexta

## Backup e Restore

O Supabase oferece backups automáticos em planos pagos. Para backup manual:

1. **Exportar dados**: Use o painel Supabase > Database > Backups
2. **Restore**: Supabase > Project Settings > Backups > Restore

Para backup programático, use `pg_dump` ou a API do Supabase. Documente procedimentos de restore em caso de desastre.

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Realtime)
- TanStack Query
- Sonner (toast)
