# Nexus Integrations - Deployment Guide for Easypanel

## 📦 Sobre o Projeto

Sistema de gerenciamento de Squads, Projects e Integrations com Google Analytics 4, Google Ads e Meta Ads.

**Stack:**
- React 19 + TypeScript
- Vite 6
- Supabase (Auth + Database)
- React Router 7 (HashRouter)
- Tailwind CSS
- Lucide Icons

---

## 🚀 Deploy no Easypanel

### Opção 1: Deploy com Docker (Recomendado)

O projeto inclui `Dockerfile` e `nginx.conf` prontos para uso.

**1. Configurar Variáveis de Ambiente**

No painel do Easypanel, adicione:

```env
VITE_SUPABASE_URL=https://ykulqajpjycyxhqmnamu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_HQrbHYa1-JpdK3JojrjT8w_PefCFRIP
```

**2. Build Settings**

- **Dockerfile:** `Dockerfile` (já incluído no projeto)
- **Port:** 80
- **Build Args:** Variáveis de ambiente são passadas durante o build

**3. O que o Dockerfile faz:**

```dockerfile
# Stage 1: Build
- Usa Node 18 Alpine
- Instala dependências (npm ci)
- Compila o código (npm run build)

# Stage 2: Production
- Usa Nginx Alpine (servidor leve)
- Copia arquivos compilados para /usr/share/nginx/html
- Serve a aplicação na porta 80
```

### Opção 2: Deploy sem Docker

**1. Configurar Variáveis de Ambiente**

```env
VITE_SUPABASE_URL=https://ykulqajpjycyxhqmnamu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_HQrbHYa1-JpdK3JojrjT8w_PefCFRIP
```

**2. Build Settings**

- **Build Command:** `npm install && npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18 ou superior

**3. Nginx Configuration**

Use a configuração incluída em `nginx.conf`:
- SPA routing (try_files)
- Gzip compression
- Cache de assets estáticos
- Security headers

---

## 🔧 Configuração do Supabase

### 1. Tabelas Necessárias

Certifique-se de que as seguintes tabelas existem no Supabase:

#### **organizations**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **squads**
```sql
CREATE TABLE squads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  squad_id UUID REFERENCES squads(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **integrations**
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  organization_id UUID REFERENCES organizations(id),
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. OAuth Configuration

No Supabase Dashboard > Authentication > Providers:

**Google OAuth:**
- Habilite o provider Google
- Adicione Client ID e Client Secret do Google Cloud Console
- **Redirect URLs permitidas:**
  - `http://localhost:3000/#/auth/callback` (desenvolvimento)
  - `https://seu-dominio.com/#/auth/callback` (produção)

**Scopes necessários (configurados no código):**
- `https://www.googleapis.com/auth/analytics.readonly`
- `https://www.googleapis.com/auth/analytics.manage.users.readonly`

---

## 📋 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Easypanel
- [ ] Tabelas criadas no Supabase
- [ ] Google OAuth configurado no Supabase
- [ ] Redirect URLs atualizadas com o domínio de produção
- [ ] Build rodando sem erros
- [ ] Login funcionando
- [ ] Integração GA4 testada

---

## 🔐 Segurança

**Hardcoded Organization ID:**
O ID da organização `40dc1851-80bb-4774-b57b-6c9a55977b92` está fixo no código nos seguintes arquivos:
- `pages/Squads.tsx`
- `pages/Projects.tsx`
- `pages/Integrations.tsx`

**Para multi-tenant:**
Substitua por lógica dinâmica buscando o `organization_id` do perfil do usuário.

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do Easypanel
2. Verifique o console do navegador (F12)
3. Verifique os logs do Supabase
4. Confirme que as variáveis de ambiente estão corretas

---

## 🎯 URLs Importantes

- **Supabase Project:** https://ykulqajpjycyxhqmnamu.supabase.co
- **Google Analytics Admin API:** https://analyticsadmin.googleapis.com/v1beta/accountSummaries

---

**Desenvolvido com Claude Code** 🤖
