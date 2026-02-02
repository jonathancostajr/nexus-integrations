# Nexus Integrations

Sistema de gerenciamento de Squads, Projects e Integrations com Google Analytics 4, Google Ads e Meta Ads.

## 🚀 Recursos

- ✅ Login com Google OAuth
- ✅ Gerenciamento de Squads
- ✅ Gerenciamento de Projects
- ✅ Integração real com Google Analytics 4
- ✅ Interface moderna com Tailwind CSS
- ✅ Autenticação via Supabase
- ✅ Banco de dados PostgreSQL (Supabase)

## 🛠️ Tecnologias

- React 19
- TypeScript
- Vite 6
- Supabase (Auth + Database)
- React Router 7 (HashRouter)
- Tailwind CSS
- Lucide Icons
- Google Analytics Admin API

## 📦 Instalação Local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas credenciais do Supabase

# Rodar em desenvolvimento
npm run dev
```

## 🚀 Deploy

Veja [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções detalhadas de deploy no Easypanel.

## 📁 Estrutura do Projeto

```
nexus-integrations/
├── pages/              # Páginas da aplicação
│   ├── Login.tsx       # Página de login
│   ├── AuthCallback.tsx # Callback OAuth
│   ├── Squads.tsx      # Listagem de squads
│   ├── Projects.tsx    # Listagem de projects
│   └── Integrations.tsx # Gerenciamento de integrações
├── components/         # Componentes reutilizáveis
│   ├── Layout.tsx      # Layout principal com sidebar
│   └── Breadcrumbs.tsx # Navegação breadcrumb
├── services/           # Serviços e APIs
│   └── supabase.ts     # Cliente Supabase
└── types.ts            # TypeScript types
```

## 🔑 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Funcionalidades

### Squads
- Criar squads
- Listar squads da organização
- Navegação para projects

### Projects
- Criar projects dentro de um squad
- Listar projects de um squad
- Status: active/archived

### Integrations
- **Google Analytics 4**: Conectar propriedades GA4 reais
- **Google Ads**: Em desenvolvimento
- **Meta Ads**: Em desenvolvimento

## 📖 Como Funciona a Integração GA4

1. Usuário faz login com Google (OAuth com scopes do Analytics)
2. Na página de Integrations, clica em "Connect Google Analytics 4"
3. Sistema busca propriedades GA4 via Google Analytics Admin API
4. Usuário seleciona uma propriedade
5. Integração é salva no Supabase com metadata em JSONB

## 🔐 Segurança

- Autenticação OAuth via Supabase
- Token de acesso armazenado de forma segura
- Permissões específicas para Google Analytics
- RLS (Row Level Security) no Supabase (recomendado)

## 🤝 Contribuindo

Este projeto foi desenvolvido com Claude Code.

## 📄 Licença

MIT
