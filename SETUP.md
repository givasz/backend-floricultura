# Guia de Setup Completo - Backend API

## Status Atual ✅

- ✅ Dependências instaladas
- ✅ Prisma Client gerado
- ✅ Arquivo `.env` configurado
- ⏳ **Falta apenas:** Iniciar PostgreSQL e executar migrações

## Passo a Passo para Rodar o Projeto

### 1. Iniciar o PostgreSQL

Você tem 3 opções:

#### Opção A: Docker (Recomendado - Mais Rápido)

```bash
docker run --name postgres-backend -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=backend_db -p 5432:5432 -d postgres:15
```

#### Opção B: Docker Compose

Criar arquivo `docker-compose.yml` na raiz do projeto:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: postgres-backend
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: backend_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Depois executar:
```bash
docker-compose up -d
```

#### Opção C: PostgreSQL Local

Se você tem PostgreSQL instalado localmente, crie o banco:
```sql
CREATE DATABASE backend_db;
```

### 2. Executar as Migrações do Prisma

Após o PostgreSQL estar rodando:

```bash
npm run migrate
```

Ou diretamente:
```bash
npx prisma migrate dev --name init
```

### 3. Iniciar o Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# OU modo produção
npm start
```

O servidor estará rodando em: **http://localhost:3000**

## Verificar se Está Funcionando

```bash
curl http://localhost:3000/health
```

Deve retornar: `{"ok":true}`

## Credenciais Administrativas Configuradas

No arquivo `.env`:

- **Bearer Token:** `admin_token_secreto_12345`
- **Basic Auth:**
  - User: `admin`
  - Password: `admin@2024`

## Testar Rotas Protegidas

### Criar uma categoria (Admin)

```bash
curl -X POST http://localhost:3000/categories \
  -H "Authorization: Bearer admin_token_secreto_12345" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pizzas"}'
```

OU com Basic Auth:
```bash
curl -X POST http://localhost:3000/categories \
  -u admin:admin@2024 \
  -H "Content-Type: application/json" \
  -d '{"name": "Pizzas"}'
```

### Criar um produto (Admin)

```bash
curl -X POST http://localhost:3000/products \
  -H "Authorization: Bearer admin_token_secreto_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Margherita",
    "description": "Molho de tomate, queijo mozzarella e manjericão",
    "price": 39.90,
    "imageUrl": "https://example.com/margherita.jpg",
    "categoryId": 1,
    "active": true
  }'
```

### Listar produtos (Público)

```bash
curl http://localhost:3000/products
```

### Criar um carrinho (Público)

```bash
curl -X POST http://localhost:3000/carrinho \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "João Silva",
    "phone": "+5511999999999",
    "note": "Entrega urgente",
    "items": [
      { "productId": 1, "qty": 2 }
    ]
  }'
```

## Comandos Úteis

```bash
# Ver tabelas no banco
npx prisma studio

# Ver logs do PostgreSQL (Docker)
docker logs postgres-backend

# Parar PostgreSQL (Docker)
docker stop postgres-backend

# Iniciar PostgreSQL novamente (Docker)
docker start postgres-backend

# Resetar banco de dados (CUIDADO!)
npx prisma migrate reset
```

## Estrutura das Rotas

### Públicas
- `GET /health` - Health check
- `POST /users` - Criar usuário
- `GET /users` - Listar usuários
- `GET /categories` - Listar categorias
- `GET /products` - Listar produtos
- `POST /carrinho` - Criar carrinho
- `GET /carrinho/:uid` - Ver carrinho

### Protegidas (Admin)
- `POST /categories` - Criar categoria
- `PUT /categories/:id` - Atualizar categoria
- `DELETE /categories/:id` - Deletar categoria
- `POST /products` - Criar produto
- `PUT /products/:id` - Atualizar produto
- `DELETE /products/:id` - Deletar produto
- `POST /products/:id/toggle` - Ativar/desativar produto
- `PUT /carrinho/:uid` - Atualizar carrinho
- `GET /admin/carrinhos` - Listar todos os carrinhos

## Próximos Passos Recomendados

1. Instalar uma ferramenta para testar APIs:
   - [Postman](https://www.postman.com/)
   - [Insomnia](https://insomnia.rest/)
   - [Bruno](https://www.usebruno.com/)

2. Explorar o banco de dados visualmente:
   ```bash
   npm run studio
   ```

3. Testar todas as rotas e criar dados de exemplo

## Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando: `docker ps`
- Teste a conexão: `psql "postgresql://postgres:postgres@localhost:5432/backend_db"`

### Erro: "Port 3000 already in use"
- Altere a porta no `.env`: `PORT=3001`

### Erro: "Prisma Client not found"
- Execute: `npx prisma generate`

## Arquitetura do Projeto

```
src/
├── index.js              # Entry point, registra rotas
├── server.js             # Configuração do Express
├── prismaClient.js       # Singleton do Prisma Client
├── middlewares/
│   └── adminAuth.js      # Autenticação Bearer/Basic
└── routes/
    ├── users.js          # CRUD usuários
    ├── products.js       # CRUD produtos (admin)
    ├── categories.js     # CRUD categorias (admin)
    └── carts.js          # Carrinhos + link único
```

## Segurança

⚠️ **Para Produção:**
- Altere `ADMIN_TOKEN`, `ADMIN_USER` e `ADMIN_PASS` para valores seguros
- Use HTTPS (não HTTP)
- Configure CORS adequadamente
- Adicione rate limiting
- Use variáveis de ambiente seguras (secrets managers)
- Valide todos os inputs
