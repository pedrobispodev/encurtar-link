# LinkSnap - Encurtador de Links

Encurtador de links gratuito usando **Supabase** (backend) + **GitHub Pages** (frontend).

## Estrutura do Projeto

```
link-shortener/
├── index.html          # Interface principal
├── style.css           # Estilos (design moderno e responsivo)
├── script.js           # Lógica do frontend
├── supabase-config.js  # Configuração do Supabase (INSIRA SUAS CHAVES AQUI)
├── setup-database.sql  # Script SQL para criar a tabela
└── README.md           # Este arquivo
```

## Guia de Deploy Passo a Passo

### Passo 1: Criar Conta no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Start your project"** ou **"New Project"**
3. Crie uma conta gratuita (pode usar login com GitHub)
4. Preencha os dados do projeto:
   - **Name**: `link-snap` (ou qualquer nome)
   - **Database Password**: crie uma senha segura
   - **Region**: escolha a mais próxima (ex: South America - São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos

### Passo 2: Criar a Tabela no Banco de Dados

1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `setup-database.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Você verá a mensagem "Success. No rows returned"

### Passo 3: Obter as Chaves de API

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Copie os seguintes valores:
   - **Project URL**: começa com `https://` e termina com `.supabase.co`
   - **anon public key**: um token longo começando com `eyJ...`

### Passo 4: Configurar o Frontend

1. Abra o arquivo `supabase-config.js`
2. Substitua os valores:

```javascript
const SUPABASE_URL = 'https://SEU-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY-AQUI';
```

Por exemplo:
```javascript
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Passo 5: Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex: `link-snap`)
2. Faça upload de todos os arquivos do projeto
3. Vá em **Settings** > **Pages**
4. Em **Source**, selecione **"Deploy from a branch"**
5. Escolha a branch `main` e a pasta `/ (root)`
6. Clique em **"Save"**
7. Aguarde 1-2 minutos
8. Seu site estará disponível em: `https://SEU-USUARIO.github.io/link-snap/`

### Passo 6: Testar

1. Acesse seu site no GitHub Pages
2. Cole qualquer URL (ex: `https://github.com/usuario/projeto`)
3. Clique em **"Encurtar"**
4. Copie o link gerado e teste em outra aba

## Como Funciona

- **Frontend**: HTML + CSS + JavaScript puro (sem frameworks)
- **Backend**: Supabase (PostgreSQL + API REST automática)
- **Armazenamento**: Tabela `links` no Supabase
- **Redirecionamento**: Quando alguém acessa o link curto, o JavaScript busca a URL original no Supabase e redireciona

## Personalização

### Alterar o comprimento do código curto

No arquivo `script.js`, procure por:
```javascript
function generateShortCode(length = 6) {
```
Altere o valor `6` para o tamanho desejado.

### Alterar as cores

No arquivo `style.css`, modifique as variáveis CSS no início:
```css
:root {
    --primary: #6366f1;    /* Cor principal */
    --bg: #0f172a;          /* Fundo */
    /* ... */
}
```

