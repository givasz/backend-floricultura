# Backend API - Node/Express + Prisma + PostgreSQL

API REST para gerenciamento de usuários, produtos, categorias e carrinhos de compra, com autenticação administrativa.

## Estrutura do Projeto

```
backend/
├── src/
│   ├── routes/           # Rotas organizadas por domínio
│   │   ├── users.js
│   │   ├── products.js
│   │   ├── categories.js
│   │   └── carts.js
│   ├── middlewares/      # Middlewares customizados
│   │   └── adminAuth.js  # Middleware de autenticação admin
│   ├── prismaClient.js   # Instância do Prisma Client
│   ├── server.js         # Configuração do Express
│   └── index.js          # Entry point da aplicação
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── .env                  # Variáveis de ambiente (criar a partir do .env.example)
├── .env.example          # Template de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## Pré-requisitos

- Node.js (v16 ou superior)
- PostgreSQL (v12 ou superior)
- Docker (opcional, para rodar PostgreSQL em container)

## Configuração do Banco de Dados

### Opção 1: PostgreSQL com Docker

```bash
docker run --name postgres-dev \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:15
```

### Opção 2: PostgreSQL instalado localmente

Certifique-se de que o PostgreSQL está rodando e crie um banco de dados:

```sql
CREATE DATABASE mydb;
CREATE USER admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;
```

## Instalação

1. **Clone o repositório e instale as dependências:**

```bash
cd backend
npm install
```

2. **Configure as variáveis de ambiente:**

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DATABASE_URL="postgresql://admin:admin123@localhost:5432/mydb?schema=public"
PORT=3000
APP_BASE_URL=http://localhost:3000

# Credenciais de administrador (ALTERE PARA PRODUÇÃO!)
ADMIN_TOKEN=seu_token_super_secreto_aqui
ADMIN_USER=admin
ADMIN_PASS=senha_forte_aqui
```

3. **Execute as migrações do Prisma:**

```bash
npm run migrate
```

4. **Inicie o servidor:**

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

O servidor estará rodando em `http://localhost:3000`

## Rotas da API

### Health Check

- `GET /health` - Verifica se o servidor está rodando

### Usuários (`/users`)

- `POST /users` - Criar usuário
- `GET /users` - Listar usuários
- `GET /users/:id` - Buscar usuário por ID
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Categorias (`/categories`)

- `POST /categories` 🔒 - Criar categoria (admin)
- `GET /categories` - Listar categorias
- `GET /categories/:id` - Buscar categoria por ID
- `PUT /categories/:id` 🔒 - Atualizar categoria (admin)
- `DELETE /categories/:id` 🔒 - Deletar categoria (admin)

### Produtos (`/products`)

- `POST /products` 🔒 - Criar produto (admin)
- `GET /products` - Listar produtos (filtros: `?category=ID&active=true`)
- `GET /products/:id` - Buscar produto por ID
- `PUT /products/:id` 🔒 - Atualizar produto (admin)
- `DELETE /products/:id` 🔒 - Deletar produto (admin)
- `POST /products/:id/toggle` 🔒 - Ativar/desativar produto (admin)

### Carrinhos (`/carrinho`)

- `POST /carrinho` - Criar carrinho e gerar link único
- `GET /carrinho/:uid` - Visualizar carrinho por UID (público)
- `PUT /carrinho/:uid` 🔒 - Atualizar carrinho (admin)
- `GET /admin/carrinhos` 🔒 - Listar todos os carrinhos (admin)

🔒 = Requer autenticação administrativa

## Autenticação Administrativa

As rotas protegidas requerem autenticação via header `Authorization`. Duas opções:

### 1. Bearer Token

```bash
curl -H "Authorization: Bearer seu_token_super_secreto_aqui" \
  http://localhost:3000/products
```

### 2. Basic Auth

```bash
curl -u admin:senha_forte_aqui \
  http://localhost:3000/products
```

## Exemplos de Uso

### Criar um produto (Admin)

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer seu_token_super_secreto_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "description": "Molho, queijo e manjericão",
    "price": 35.90,
    "imageUrl": "https://example.com/pizza.jpg",
    "categoryId": 1,
    "active": true
  }'
```

### Criar um carrinho

```bash
curl -X POST http://localhost:3000/carrinho \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "João Silva",
    "phone": "+5511999999999",
    "note": "Entrega urgente",
    "items": [
      { "productId": 1, "qty": 2 },
      { "productId": 3, "qty": 1 }
    ]
  }'
```

Resposta:
```json
{
  "cartId": 1,
  "uid": "a3b4c5d6",
  "link": "http://localhost:3000/carrinho/a3b4c5d6"
}
```

### Visualizar carrinho

```bash
curl http://localhost:3000/carrinho/a3b4c5d6
```

## Scripts Disponíveis

```bash
npm start        # Inicia o servidor
npm run dev      # Inicia com auto-reload (nodemon)
npm run migrate  # Executa migrações do Prisma
npm run studio   # Abre Prisma Studio (GUI para o banco)
```

## Segurança

⚠️ **IMPORTANTE para PRODUÇÃO:**

1. **Altere as credenciais administrativas** no arquivo `.env`
2. Use valores fortes e aleatórios para `ADMIN_TOKEN`
3. Nunca commite o arquivo `.env` no Git
4. Use HTTPS em produção
5. Configure CORS adequadamente
6. Considere rate limiting para APIs públicas

## Troubleshooting

### Erro de conexão com o banco

Verifique se o PostgreSQL está rodando:
```bash
docker ps  # Se estiver usando Docker
# ou
pg_isready  # Se instalado localmente
```

### Prisma Client não encontrado

Execute:
```bash
npx prisma generate
```

### Porta já em uso

Altere a variável `PORT` no arquivo `.env`

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **nanoid** - Geração de IDs únicos curtos
- **dotenv** - Gerenciamento de variáveis de ambiente

## Licença

ISC
