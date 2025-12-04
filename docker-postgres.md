# Comandos Docker para PostgreSQL

## Iniciar PostgreSQL (escolha uma opção)

### Opção 1: Docker (Recomendado)
```bash
docker run --name postgres-backend \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=backend_db \
  -p 5432:5432 \
  -d postgres:15
```

### Opção 2: Docker Compose
Crie um arquivo `docker-compose.yml`:

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

Depois execute:
```bash
docker-compose up -d
```

## Comandos úteis

### Verificar se o container está rodando
```bash
docker ps
```

### Ver logs do PostgreSQL
```bash
docker logs postgres-backend
```

### Parar o container
```bash
docker stop postgres-backend
```

### Iniciar o container novamente
```bash
docker start postgres-backend
```

### Remover o container
```bash
docker rm -f postgres-backend
```

### Acessar o PostgreSQL via CLI
```bash
docker exec -it postgres-backend psql -U postgres -d backend_db
```

## Após iniciar o PostgreSQL

1. Execute as migrações:
```bash
npm run migrate
```

2. Inicie o servidor:
```bash
npm start
# ou em modo desenvolvimento
npm run dev
```
