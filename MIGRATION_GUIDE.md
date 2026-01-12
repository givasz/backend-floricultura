# Guia de Migração para Múltiplas Categorias

## Problema Encontrado

O script automático está tendo conflitos com o Prisma Client devido à mudança estrutural no schema. Vamos fazer a migração manualmente de forma mais segura.

## Opção 1: Migração Simples (Sem Dados Importantes)

Se você **não tem dados importantes** no banco, pode simplesmente resetar:

```bash
npx prisma migrate reset --force
npx prisma migrate dev --name add-multiple-categories
```

Isso vai limpar o banco e aplicar o novo schema.

---

## Opção 2: Migração Manual com Backup (Dados Importantes)

Se você **tem dados importantes**, siga estes passos:

### Passo 1: Fazer backup manual via pgAdmin ou dump

```bash
# Windows (usando pg_dump se tiver PostgreSQL instalado)
pg_dump -U seu_usuario -h localhost -p 5432 flordemaio_bd > backup.sql

# Ou use o pgAdmin para exportar os dados
```

### Passo 2: Anotar produtos e suas categorias atuais

Execute esta query no banco ANTES da migração para ter um registro:

```sql
SELECT id, name, "categoryId"
FROM "Product"
WHERE "categoryId" IS NOT NULL;
```

Salve o resultado em um arquivo de texto.

### Passo 3: Aplicar a migração

```bash
npx prisma migrate reset --force
npx prisma migrate dev --name add-multiple-categories
```

### Passo 4: Restaurar dados manualmente

Depois de aplicar a migration, você pode recriar os dados via API ou pelo pgAdmin.

---

## Opção 3: Migração com SQL Direto (Avançado)

Se você sabe SQL e quer manter os dados, pode fazer a migração direto no banco:

### 1. Criar a tabela intermediária primeiro

```sql
CREATE TABLE "ProductCategory" (
  "id" SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL,
  "categoryId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductCategory_productId_categoryId_key" UNIQUE ("productId", "categoryId"),
  CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
  CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);
```

### 2. Migrar dados existentes

```sql
-- Copiar relações antigas para a nova tabela
INSERT INTO "ProductCategory" ("productId", "categoryId", "createdAt")
SELECT id, "categoryId", NOW()
FROM "Product"
WHERE "categoryId" IS NOT NULL;
```

### 3. Remover coluna antiga

```sql
-- Remover a coluna categoryId da tabela Product
ALTER TABLE "Product" DROP COLUMN "categoryId";
```

### 4. Sincronizar Prisma

```bash
# Dizer ao Prisma que o banco está atualizado
npx prisma db pull
npx prisma generate
```

### 5. Marcar como migrada

Crie um arquivo de migration vazio para o Prisma saber que foi aplicado:

```bash
npx prisma migrate resolve --applied add-multiple-categories
```

---

## Recomendação

Para seu caso, recomendo a **Opção 1** se você ainda está em desenvolvimento e não tem muitos dados importantes. É a mais rápida e segura.

Se você tem dados importantes, use a **Opção 3** (SQL direto) que mantém seus dados intactos.

## Após a Migração

Independente da opção escolhida, após a migração:

1. Verifique se o servidor inicia sem erros
2. Teste criar um produto com múltiplas categorias via API
3. Teste filtrar produtos por categoria

## Dúvidas?

Se precisar de ajuda com alguma dessas opções, me avise!
