# Prompt para o Claude do Frontend - Múltiplas Categorias

Copie e cole este prompt para o Claude que está trabalhando no frontend:

---

# Atualização: Produtos com Múltiplas Categorias

O backend foi atualizado para permitir que **um produto pertença a múltiplas categorias simultaneamente**. Você precisa atualizar o painel administrativo e as páginas públicas para suportar essa nova funcionalidade.

## O que mudou na API

### Estrutura de Dados

**ANTES (descontinuado):**
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

**AGORA (novo formato):**
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

### Mudanças nas Rotas

#### 1. POST /api/products (Admin - Criar Produto)

**Campo alterado:** `categoryId` → `categoryIds` (array)

**Antes:**
```json
{
  "name": "Buquê de Rosas",
  "price": 89.90,
  "categoryId": 2
}
```

**Agora:**
```json
{
  "name": "Buquê de Rosas",
  "price": 89.90,
  "categoryIds": [2, 5, 8]
}
```

#### 2. PUT /api/products/:id (Admin - Atualizar Produto)

**Campo alterado:** `categoryId` → `categoryIds` (array)

**Importante:** O array `categoryIds` **substitui completamente** as categorias antigas.

```json
{
  "name": "Buquê de Rosas Brancas",
  "price": 99.90,
  "categoryIds": [2, 7]
}
```

#### 3. GET /api/products (Público - Listar Produtos)

**Resposta alterada:** `category` → `categories` (array)

O filtro por categoria continua funcionando normalmente:
```
GET /api/products?category=5
```

Retorna todos os produtos que **contêm** a categoria 5 (não precisa ser a única).

#### 4. GET /api/products/:id (Público - Buscar Produto)

**Resposta alterada:** `category` → `categories` (array)

---

## Tarefas a Implementar

### 1. Painel Admin - Formulário de Criar Produto

**Localização:** Página/componente de criação de produtos (admin)

**O que fazer:**

1. **Substituir o select simples por um de múltipla seleção**

   **Antes (select simples):**
   ```jsx
   <select
     value={categoryId}
     onChange={(e) => setCategoryId(e.target.value)}
   >
     <option value="">Selecione uma categoria</option>
     {categories.map(cat => (
       <option key={cat.id} value={cat.id}>{cat.name}</option>
     ))}
   </select>
   ```

   **Agora (opção com checkboxes - RECOMENDADO):**
   ```jsx
   <div className="category-selection">
     <label>Categorias (selecione uma ou mais):</label>
     {categories.map(cat => (
       <label key={cat.id} className="checkbox-label">
         <input
           type="checkbox"
           checked={categoryIds.includes(cat.id)}
           onChange={(e) => {
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

2. **Atualizar o estado do componente**

   **Antes:**
   ```jsx
   const [categoryId, setCategoryId] = useState('');
   ```

   **Agora:**
   ```jsx
   const [categoryIds, setCategoryIds] = useState([]);
   ```

3. **Atualizar a função de submit**

   **Antes:**
   ```jsx
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
         categoryId: parseInt(categoryId), // ← número único
         active
       })
     });
   };
   ```

   **Agora:**
   ```jsx
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
         categoryIds: categoryIds.map(id => parseInt(id)), // ← array de números
         active
       })
     });
   };
   ```

---

### 2. Painel Admin - Formulário de Editar Produto

**Localização:** Página/componente de edição de produtos (admin)

**O que fazer:**

1. **Atualizar o carregamento inicial do produto**

   **Antes:**
   ```jsx
   useEffect(() => {
     // Carregar produto
     const loadProduct = async () => {
       const response = await fetch(`/api/products/${id}`);
       const product = await response.json();

       setName(product.name);
       setPrice(product.price);
       setCategoryId(product.categoryId); // ← campo antigo
     };

     loadProduct();
   }, [id]);
   ```

   **Agora:**
   ```jsx
   useEffect(() => {
     // Carregar produto
     const loadProduct = async () => {
       const response = await fetch(`/api/products/${id}`);
       const product = await response.json();

       setName(product.name);
       setPrice(product.price);
       // Extrair os IDs das categorias do produto
       setCategoryIds(product.categories.map(pc => pc.categoryId)); // ← novo formato
     };

     loadProduct();
   }, [id]);
   ```

2. **Usar os mesmos componentes do formulário de criação**

   - Checkboxes para seleção múltipla
   - Estado `categoryIds` (array)
   - Submit com `categoryIds`

---

### 3. Página Pública - Cards/Lista de Produtos

**Localização:** Componentes que exibem produtos para o cliente

**O que fazer:**

1. **Atualizar a exibição das categorias**

   **Antes:**
   ```jsx
   function ProductCard({ product }) {
     return (
       <div className="product-card">
         <img src={product.imageUrl} alt={product.name} />
         <h3>{product.name}</h3>
         <p className="price">R$ {product.price.toFixed(2)}</p>

         {product.category && (
           <span className="category">{product.category.name}</span>
         )}
       </div>
     );
   }
   ```

   **Agora:**
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

2. **CSS sugerido para múltiplas badges:**

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

### 4. Página Pública - Detalhes do Produto

**Localização:** Página de detalhes/visualização completa do produto

**O que fazer:**

**Antes:**
```jsx
function ProductDetails({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>R$ {product.price.toFixed(2)}</p>

      {product.category && (
        <p>Categoria: {product.category.name}</p>
      )}
    </div>
  );
}
```

**Agora:**
```jsx
function ProductDetails({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>R$ {product.price.toFixed(2)}</p>

      {product.categories.length > 0 && (
        <div>
          <p>Categorias:</p>
          <div className="categories">
            {product.categories.map(pc => (
              <span key={pc.id} className="category-badge">
                {pc.category.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 5. Filtros por Categoria (se existirem)

**Localização:** Componentes de filtro/busca

**O que fazer:**

**O filtro continua funcionando da mesma forma!**

```jsx
// Isso continua funcionando normalmente
const filterByCategory = (categoryId) => {
  fetch(`/api/products?category=${categoryId}`)
    .then(res => res.json())
    .then(data => setProducts(data.data || data));
};
```

A única diferença é que agora um produto pode aparecer em **múltiplos filtros** porque ele pode ter múltiplas categorias.

---

## Checklist de Implementação

### Painel Admin
- [ ] Atualizar formulário de criação de produto
  - [ ] Substituir select simples por checkboxes
  - [ ] Mudar estado de `categoryId` para `categoryIds` (array)
  - [ ] Atualizar função de submit para enviar `categoryIds`
- [ ] Atualizar formulário de edição de produto
  - [ ] Carregar `categoryIds` corretamente do produto
  - [ ] Usar mesmos checkboxes do formulário de criação
  - [ ] Atualizar função de submit para enviar `categoryIds`
- [ ] Atualizar lista de produtos (se mostrar categorias)
  - [ ] Mudar `product.category` para `product.categories` (array)
  - [ ] Exibir múltiplas badges de categoria

### Páginas Públicas
- [ ] Atualizar cards de produtos
  - [ ] Mudar `product.category` para `product.categories` (array)
  - [ ] Adicionar CSS para exibir múltiplas badges
- [ ] Atualizar página de detalhes do produto
  - [ ] Mudar `product.category` para `product.categories` (array)
  - [ ] Exibir todas as categorias do produto
- [ ] Testar filtros por categoria (devem continuar funcionando)

### Testes
- [ ] Criar produto com múltiplas categorias
- [ ] Criar produto sem categoria (deve funcionar)
- [ ] Editar produto e trocar as categorias
- [ ] Verificar que produtos aparecem em todos os filtros das suas categorias
- [ ] Verificar exibição visual das múltiplas badges de categoria

---

## Componente React Completo de Exemplo

Aqui está um exemplo completo de formulário de produto (criar/editar):

```jsx
import { useState, useEffect } from 'react';

function ProductForm({ productId, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryIds, setCategoryIds] = useState([]);
  const [active, setActive] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar categorias disponíveis
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  // Se estiver editando, carregar produto
  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(product => {
          setName(product.name);
          setDescription(product.description);
          setPrice(product.price);
          setImageUrl(product.imageUrl);
          setActive(product.active);
          // Extrair IDs das categorias
          setCategoryIds(product.categories.map(pc => pc.categoryId));
        });
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          imageUrl,
          categoryIds: categoryIds.map(id => parseInt(id)),
          active
        })
      });

      if (response.ok) {
        alert('Produto salvo com sucesso!');
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    if (categoryIds.includes(categoryId)) {
      setCategoryIds(categoryIds.filter(id => id !== categoryId));
    } else {
      setCategoryIds([...categoryIds, categoryId]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nome:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Descrição:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label>Preço:</label>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div>
        <label>URL da Imagem:</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>

      <div className="category-selection">
        <label>Categorias (selecione uma ou mais):</label>
        {categories.map(cat => (
          <label key={cat.id} className="checkbox-label">
            <input
              type="checkbox"
              checked={categoryIds.includes(cat.id)}
              onChange={() => handleCategoryToggle(cat.id)}
            />
            {cat.name}
          </label>
        ))}
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Produto ativo
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (productId ? 'Atualizar' : 'Criar')} Produto
      </button>
    </form>
  );
}

export default ProductForm;
```

---

## CSS Sugerido

```css
/* Formulário de categorias */
.category-selection {
  margin: 1rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
}

.checkbox-label:hover {
  background: #f5f5f5;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Badges de categoria */
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
  white-space: nowrap;
}

/* Variações de cores para diferentes categorias (opcional) */
.category-badge:nth-child(2) {
  background: #f3e5f5;
  color: #7b1fa2;
}

.category-badge:nth-child(3) {
  background: #e8f5e9;
  color: #388e3c;
}

.category-badge:nth-child(4) {
  background: #fff3e0;
  color: #f57c00;
}
```

---

## Resumo das Mudanças

| Item | Antes | Agora |
|------|-------|-------|
| Campo no POST/PUT | `categoryId` (número) | `categoryIds` (array de números) |
| Campo na resposta | `category` (objeto) | `categories` (array de objetos) |
| Estado do formulário | `useState('')` | `useState([])` |
| Input do formulário | `<select>` | `<input type="checkbox">` |
| Exibição | `{product.category?.name}` | `{product.categories.map(...)}` |

---

## Dúvidas Frequentes

**P: E se eu não selecionar nenhuma categoria?**
R: Pode enviar `categoryIds: []` vazio. O produto ficará sem categoria.

**P: O filtro por categoria ainda funciona?**
R: Sim! `GET /api/products?category=5` retorna todos os produtos que tenham a categoria 5 (entre outras).

**P: Preciso alterar algo nas rotas de categorias?**
R: Não! As rotas de categorias (`GET /api/categories`, etc.) continuam iguais.

**P: E os produtos que já existem?**
R: Após a migration, produtos que tinham 1 categoria continuam tendo essa categoria (mas agora no formato de array).

---

Se tiver dúvidas sobre a implementação, me avise!
