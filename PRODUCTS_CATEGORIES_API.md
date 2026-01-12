# API de Produtos com Múltiplas Categorias - Documentação Frontend

## Mudanças Importantes

O sistema foi atualizado para permitir que **um produto pertença a múltiplas categorias simultaneamente**.

### O que mudou no banco de dados

- **Antes**: Um produto tinha apenas `categoryId` (relação 1:N)
- **Agora**: Um produto tem `categories` (relação N:N através de `ProductCategory`)

### O que mudou nas rotas

- Campo `categoryId` foi substituído por `categoryIds` (array)
- Resposta dos produtos agora retorna `categories` (array) ao invés de `category` (objeto)

---

## Estrutura de Dados

### Formato Antigo (descontinuado)
```json
{
  "id": 1,
  "name": "Buquê de Rosas",
  "categoryId": 2,
  "category": {
    "id": 2,
    "name": "Buquês"
  }
}
```

### Formato Novo (atual)
```json
{
  "id": 1,
  "name": "Buquê de Rosas",
  "categories": [
    {
      "id": 1,
      "productId": 1,
      "categoryId": 2,
      "category": {
        "id": 2,
        "name": "Buquês",
        "imageUrl": "https://..."
      }
    },
    {
      "id": 2,
      "productId": 1,
      "categoryId": 5,
      "category": {
        "id": 5,
        "name": "Dia dos Namorados",
        "imageUrl": "https://..."
      }
    }
  ]
}
```

---

## Rotas da API

### 1. POST /api/products (Admin)
Criar um novo produto com múltiplas categorias.

#### Body
```json
{
  "name": "Buquê de Rosas Vermelhas",
  "description": "12 rosas vermelhas com embalagem especial",
  "price": 89.90,
  "imageUrl": "https://exemplo.com/imagem.jpg",
  "categoryIds": [2, 5, 8],  // ← Array de IDs de categorias
  "active": true
}
```

#### Resposta (201)
```json
{
  "id": 1,
  "name": "Buquê de Rosas Vermelhas",
  "description": "12 rosas vermelhas com embalagem especial",
  "price": 89.90,
  "imageUrl": "https://exemplo.com/imagem.jpg",
  "active": true,
  "categories": [
    {
      "id": 1,
      "productId": 1,
      "categoryId": 2,
      "category": {
        "id": 2,
        "name": "Buquês",
        "imageUrl": "https://..."
      }
    },
    {
      "id": 2,
      "productId": 1,
      "categoryId": 5,
      "category": {
        "id": 5,
        "name": "Dia dos Namorados",
        "imageUrl": "https://..."
      }
    },
    {
      "id": 3,
      "productId": 1,
      "categoryId": 8,
      "category": {
        "id": 8,
        "name": "Presentes",
        "imageUrl": "https://..."
      }
    }
  ],
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

---

### 2. GET /api/products (Público)
Listar produtos com filtro opcional por categoria.

#### Parâmetros Query (opcionais)
- `category` - ID da categoria para filtrar (retorna produtos que tenham esta categoria)
- `active` - `true` ou `false` para filtrar por status
- `page` - Número da página (default: 1)
- `limit` - Itens por página (default: 10)
- `paginated` - `true` ou `false` (default: `true`)

#### Exemplo 1: Listar todos os produtos
```javascript
const response = await fetch('/api/products');
const data = await response.json();
```

#### Exemplo 2: Filtrar por categoria
```javascript
const response = await fetch('/api/products?category=5');
const data = await response.json();
// Retorna todos os produtos que pertencem à categoria 5
```

#### Exemplo 3: Sem paginação
```javascript
const response = await fetch('/api/products?paginated=false');
const products = await response.json(); // Array direto
```

#### Resposta Paginada (200)
```json
{
  "data": [
    {
      "id": 1,
      "name": "Buquê de Rosas",
      "price": 89.90,
      "categories": [
        {
          "id": 1,
          "category": {
            "id": 2,
            "name": "Buquês"
          }
        },
        {
          "id": 2,
          "category": {
            "id": 5,
            "name": "Dia dos Namorados"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. GET /api/products/:id (Público)
Buscar um produto específico por ID.

#### Exemplo
```javascript
const response = await fetch('/api/products/1');
const product = await response.json();
```

#### Resposta (200)
```json
{
  "id": 1,
  "name": "Buquê de Rosas",
  "description": "12 rosas vermelhas",
  "price": 89.90,
  "imageUrl": "https://...",
  "active": true,
  "categories": [
    {
      "id": 1,
      "productId": 1,
      "categoryId": 2,
      "category": {
        "id": 2,
        "name": "Buquês",
        "imageUrl": "https://..."
      }
    }
  ],
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

---

### 4. PUT /api/products/:id (Admin)
Atualizar um produto existente. **Substitui completamente as categorias.**

#### Body
```json
{
  "name": "Buquê de Rosas Brancas",
  "description": "12 rosas brancas",
  "price": 99.90,
  "imageUrl": "https://nova-imagem.jpg",
  "categoryIds": [2, 7],  // ← Novas categorias (substitui as antigas)
  "active": true
}
```

#### Comportamento
- As categorias antigas são **removidas**
- As novas categorias do array `categoryIds` são **adicionadas**

#### Exemplo
```javascript
const response = await fetch('/api/products/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_ADMIN'
  },
  body: JSON.stringify({
    name: "Buquê de Rosas Brancas",
    price: 99.90,
    categoryIds: [2, 7]
  })
});
```

---

### 5. DELETE /api/products/:id (Admin)
Deletar um produto.

```javascript
await fetch('/api/products/1', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_ADMIN'
  }
});
```

---

### 6. POST /api/products/:id/toggle (Admin)
Ativar/desativar produto (toggle de `active`).

```javascript
const response = await fetch('/api/products/1/toggle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN_ADMIN'
  }
});
```

---

## Adaptações Necessárias no Frontend

### 1. Componente de Formulário de Produto

#### Antes (select simples)
```jsx
<select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
  <option value="">Selecione uma categoria</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>
```

#### Agora (multi-select ou checkboxes)

**Opção 1: Select múltiplo**
```jsx
<select
  multiple
  value={categoryIds}
  onChange={e => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setCategoryIds(selected);
  }}
>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ))}
</select>
```

**Opção 2: Checkboxes (recomendado para melhor UX)**
```jsx
<div>
  <label>Categorias:</label>
  {categories.map(cat => (
    <label key={cat.id}>
      <input
        type="checkbox"
        checked={categoryIds.includes(cat.id)}
        onChange={e => {
          if (e.target.checked) {
            setCategoryIds([...categoryIds, cat.id]);
          } else {
            setCategoryIds(categoryIds.filter(id => id !== cat.id));
          }
        }}
      />
      {cat.name}
    </label>
  ))}
</div>
```

---

### 2. Exibir Categorias do Produto

#### Antes
```jsx
<p>Categoria: {product.category?.name}</p>
```

#### Agora
```jsx
<div>
  <p>Categorias:</p>
  <div>
    {product.categories.map(pc => (
      <span key={pc.id} className="badge">
        {pc.category.name}
      </span>
    ))}
  </div>
</div>
```

---

### 3. Função de Submit do Formulário

#### Antes
```javascript
const handleSubmit = async () => {
  await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      description,
      price,
      imageUrl,
      categoryId: parseInt(categoryId),  // ← número único
      active
    })
  });
};
```

#### Agora
```javascript
const handleSubmit = async () => {
  await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name,
      description,
      price,
      imageUrl,
      categoryIds: categoryIds.map(id => parseInt(id)),  // ← array de números
      active
    })
  });
};
```

---

## Migração de Dados Existentes

Se você já tem produtos com `categoryId`, será necessário:

1. Rodar a migration do Prisma:
```bash
npx prisma migrate dev --name add-multiple-categories
```

2. Migrar dados antigos (script de exemplo):
```javascript
// migration-script.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateOldCategories() {
  const products = await prisma.product.findMany({
    where: {
      categoryId: { not: null }
    }
  });

  for (const product of products) {
    await prisma.productCategory.create({
      data: {
        productId: product.id,
        categoryId: product.categoryId
      }
    });
  }

  console.log(`Migrated ${products.length} products`);
}

migrateOldCategories()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
```

---

## Checklist de Implementação Frontend

### Formulário de Criação/Edição
- [ ] Substituir select simples por multi-select ou checkboxes
- [ ] Alterar estado de `categoryId` para `categoryIds` (array)
- [ ] Atualizar lógica de submit para enviar `categoryIds` ao invés de `categoryId`
- [ ] Validar que pelo menos uma categoria seja selecionada (opcional)

### Exibição de Produtos
- [ ] Atualizar componentes que mostram `product.category` para `product.categories`
- [ ] Criar componente de badge/tag para exibir múltiplas categorias
- [ ] Ajustar layout para acomodar múltiplas categorias

### Filtros e Busca
- [ ] Manter filtro por categoria funcionando (query `?category=X` continua funcionando)
- [ ] Considerar adicionar filtro por múltiplas categorias (se necessário)

### Testes
- [ ] Testar criação de produto com múltiplas categorias
- [ ] Testar edição de produto alterando categorias
- [ ] Testar filtro por categoria
- [ ] Testar produto sem categoria (`categoryIds: []`)

---

## Exemplos de UI Sugeridos

### Cards de Produto
```jsx
function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="price">R$ {product.price.toFixed(2)}</p>

      <div className="categories">
        {product.categories.map(pc => (
          <span key={pc.id} className="category-badge">
            {pc.category.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### CSS Sugerido
```css
.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.category-badge {
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}
```

---

## Notas Importantes

1. **Retrocompatibilidade**: A API antiga com `categoryId` NÃO funciona mais
2. **Array vazio**: Se `categoryIds: []` for enviado, o produto ficará sem categorias
3. **Validação**: A API aceita produtos sem categorias (útil para rascunhos)
4. **Performance**: A query com filtro por categoria usa `some` do Prisma, que é otimizado
5. **Ordenação**: Produtos continuam ordenados por `id DESC` (mais recentes primeiro)

---

## Suporte

Em caso de dúvidas sobre a implementação, consulte:
- Schema do Prisma: [prisma/schema.prisma](prisma/schema.prisma)
- Rotas de produtos: [src/routes/products.js](src/routes/products.js)
