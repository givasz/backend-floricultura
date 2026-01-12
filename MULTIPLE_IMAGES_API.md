# API de Múltiplas Imagens por Produto

O backend agora suporta **múltiplas imagens por produto**! Cada produto pode ter quantas imagens você quiser, com controle de ordem de exibição.

## 📋 Estrutura de Dados

Quando você buscar um produto, ele virá com o array `images`:

```json
{
  "id": 1,
  "name": "Buquê de Rosas",
  "price": 89.90,
  "imageUrl": "/uploads/products/rosa-1.jpg", // ← Imagem principal (mantida para compatibilidade)
  "images": [ // ← NOVO: Array de imagens
    {
      "id": 1,
      "productId": 1,
      "imageUrl": "/uploads/products/rosa-1.jpg",
      "order": 0,
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "imageUrl": "/uploads/products/rosa-2.jpg",
      "order": 1,
      "createdAt": "2024-01-15T10:05:00.000Z"
    },
    {
      "id": 3,
      "productId": 1,
      "imageUrl": "/uploads/products/rosa-3.jpg",
      "order": 2,
      "createdAt": "2024-01-15T10:10:00.000Z"
    }
  ],
  "categories": [...]
}
```

---

## 🚀 Rotas Disponíveis

### 1. Listar Imagens de um Produto (Público)
```http
GET /products/:id/images
```

**Exemplo:**
```bash
curl http://localhost:3000/products/1/images
```

**Resposta:**
```json
[
  {
    "id": 1,
    "productId": 1,
    "imageUrl": "/uploads/products/rosa-1.jpg",
    "order": 0
  },
  {
    "id": 2,
    "productId": 1,
    "imageUrl": "/uploads/products/rosa-2.jpg",
    "order": 1
  }
]
```

---

### 2. Adicionar UMA Imagem (Admin)
```http
POST /products/:id/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- image: [arquivo]
- order: 0  ← OPCIONAL (se não enviar, adiciona no final)
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/products/1/images \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@foto.jpg" \
  -F "order=0"
```

**Resposta:**
```json
{
  "id": 5,
  "productId": 1,
  "imageUrl": "/uploads/products/foto-123456.jpg",
  "order": 0,
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

---

### 3. Adicionar MÚLTIPLAS Imagens de Uma Vez (Admin)
```http
POST /products/:id/images/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- images: [arquivo1]
- images: [arquivo2]
- images: [arquivo3]
...até 10 imagens
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/products/1/images/multiple \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "images=@foto1.jpg" \
  -F "images=@foto2.jpg" \
  -F "images=@foto3.jpg"
```

**Resposta:**
```json
{
  "message": "3 imagens adicionadas com sucesso",
  "images": [
    {
      "id": 6,
      "productId": 1,
      "imageUrl": "/uploads/products/foto1-123.jpg",
      "order": 0
    },
    {
      "id": 7,
      "productId": 1,
      "imageUrl": "/uploads/products/foto2-456.jpg",
      "order": 1
    },
    {
      "id": 8,
      "productId": 1,
      "imageUrl": "/uploads/products/foto3-789.jpg",
      "order": 2
    }
  ]
}
```

---

### 4. Deletar Uma Imagem (Admin)
```http
DELETE /products/:id/images/:imageId
Authorization: Bearer {token}
```

**Exemplo:**
```bash
curl -X DELETE http://localhost:3000/products/1/images/5 \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:** `204 No Content`

**Importante:** A imagem é deletada tanto do banco de dados quanto do disco.

---

### 5. Reordenar Imagens (Admin)
```http
PUT /products/:id/images/reorder
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "images": [
    { "id": 2, "order": 0 },
    { "id": 1, "order": 1 },
    { "id": 3, "order": 2 }
  ]
}
```

**Exemplo:**
```bash
curl -X PUT http://localhost:3000/products/1/images/reorder \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      { "id": 2, "order": 0 },
      { "id": 1, "order": 1 }
    ]
  }'
```

**Resposta:**
```json
[
  {
    "id": 2,
    "productId": 1,
    "imageUrl": "/uploads/products/rosa-2.jpg",
    "order": 0
  },
  {
    "id": 1,
    "productId": 1,
    "imageUrl": "/uploads/products/rosa-1.jpg",
    "order": 1
  }
]
```

---

## 💻 Código React - Exemplos

### Exemplo 1: Exibir Múltiplas Imagens (Carrossel)

```jsx
import { useState } from 'react';

function ProductImageGallery({ product }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Se não tem imagens no array, usa a imagem principal
  const images = product.images?.length > 0
    ? product.images
    : product.imageUrl
      ? [{ imageUrl: product.imageUrl }]
      : [];

  if (images.length === 0) {
    return <p>Sem imagens disponíveis</p>;
  }

  return (
    <div className="image-gallery">
      {/* Imagem Principal */}
      <div className="main-image">
        <img
          src={`http://localhost:3000${images[currentIndex].imageUrl}`}
          alt={product.name}
          style={{ width: '100%', maxWidth: 500, height: 'auto' }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="thumbnails" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {images.map((img, index) => (
            <img
              key={img.id || index}
              src={`http://localhost:3000${img.imageUrl}`}
              alt={`${product.name} - ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: 80,
                height: 80,
                objectFit: 'cover',
                cursor: 'pointer',
                border: currentIndex === index ? '2px solid blue' : '1px solid #ddd'
              }}
            />
          ))}
        </div>
      )}

      {/* Navegação (Anterior/Próximo) */}
      {images.length > 1 && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            disabled={images.length === 1}
          >
            ← Anterior
          </button>
          <span style={{ margin: '0 1rem' }}>
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            disabled={images.length === 1}
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Exemplo 2: Admin - Adicionar Múltiplas Imagens

```jsx
import { useState } from 'react';

function AddMultipleImages({ productId, onSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Limita a 10 imagens
    if (files.length > 10) {
      alert('Máximo de 10 imagens por vez');
      return;
    }

    setSelectedFiles(files);

    // Gera previews
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Selecione pelo menos uma imagem');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // Adiciona todas as imagens com o mesmo nome de campo
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`/products/${productId}/images/multiple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setSelectedFiles([]);
        setPreviews([]);
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert('Erro ao enviar imagens');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h3>Adicionar Imagens ao Produto</h3>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
      />

      {previews.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          {previews.map((preview, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                style={{ width: 100, height: 100, objectFit: 'cover' }}
              />
              <button
                onClick={() => {
                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                  const newPreviews = previews.filter((_, i) => i !== index);
                  setSelectedFiles(newFiles);
                  setPreviews(newPreviews);
                }}
                style={{ position: 'absolute', top: 0, right: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading || selectedFiles.length === 0}
        style={{ marginTop: '1rem' }}
      >
        {uploading ? 'Enviando...' : `Enviar ${selectedFiles.length} imagem(ns)`}
      </button>
    </div>
  );
}
```

---

### Exemplo 3: Admin - Gerenciar Imagens (Deletar e Reordenar)

```jsx
import { useState, useEffect } from 'react';

function ManageProductImages({ productId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      const response = await fetch(`/products/${productId}/images`);
      const data = await response.json();
      setImages(data);
    } catch (error) {
      alert('Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Tem certeza que deseja deletar esta imagem?')) {
      return;
    }

    try {
      const response = await fetch(`/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Imagem deletada com sucesso');
        loadImages(); // Recarrega a lista
      } else {
        alert('Erro ao deletar imagem');
      }
    } catch (error) {
      alert('Erro ao deletar imagem');
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;

    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;

    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  const saveOrder = async () => {
    try {
      // Monta o array de IDs com as novas ordens
      const reorderedImages = images.map((img, index) => ({
        id: img.id,
        order: index
      }));

      const response = await fetch(`/products/${productId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ images: reorderedImages })
      });

      if (response.ok) {
        alert('Ordem salva com sucesso!');
        loadImages();
      } else {
        alert('Erro ao salvar ordem');
      }
    } catch (error) {
      alert('Erro ao salvar ordem');
    }
  };

  if (loading) return <p>Carregando imagens...</p>;

  if (images.length === 0) {
    return <p>Nenhuma imagem cadastrada</p>;
  }

  return (
    <div>
      <h3>Gerenciar Imagens ({images.length})</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {images.map((img, index) => (
          <div
            key={img.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              border: '1px solid #ddd'
            }}
          >
            <span style={{ fontWeight: 'bold', width: 30 }}>{index + 1}</span>

            <img
              src={`http://localhost:3000${img.imageUrl}`}
              alt={`Imagem ${index + 1}`}
              style={{ width: 80, height: 80, objectFit: 'cover' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => moveUp(index)} disabled={index === 0}>
                ↑
              </button>
              <button onClick={() => moveDown(index)} disabled={index === images.length - 1}>
                ↓
              </button>
              <button onClick={() => handleDelete(img.id)} style={{ color: 'red' }}>
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={saveOrder} style={{ marginTop: '1rem' }}>
        Salvar Ordem
      </button>
    </div>
  );
}
```

---

## 🎯 Fluxo Recomendado

### Para o Admin (criar produto):

1. **Criar o produto** com `POST /products` ou `POST /products/with-image`
   - Neste momento, pode enviar uma imagem principal
2. **Adicionar múltiplas imagens** com `POST /products/:id/images/multiple`
   - Envia todas as fotos do produto de uma vez
3. **Reordenar** se necessário com `PUT /products/:id/images/reorder`

### Para o Público (visualizar):

1. **Buscar produto** com `GET /products/:id`
   - Recebe automaticamente o array `images` ordenado
2. **Exibir em carrossel** ou grade de imagens
   - Usar o campo `order` para garantir a ordem correta

---

## 📱 Mobile - Upload Múltiplo

No mobile, o input múltiplo funciona normalmente:

```jsx
<input
  type="file"
  accept="image/*"
  multiple // ← Permite selecionar várias imagens
  onChange={handleFileChange}
/>
```

O usuário pode:
- 📷 Tirar várias fotos seguidas
- 🖼️ Selecionar múltiplas da galeria

---

## ⚠️ Notas Importantes

1. **Campo `imageUrl` mantido**: O campo `imageUrl` no produto ainda existe para compatibilidade. Você pode usá-lo como "imagem principal" ou ignorá-lo e usar apenas o array `images`.

2. **Ordem automática**: Se não especificar `order` ao adicionar imagem, ela é adicionada no final automaticamente.

3. **Limite**: Máximo de 10 imagens por request no endpoint `/multiple`. Mas pode chamar múltiplas vezes.

4. **Deleção automática**: Quando deletar uma imagem pela API, ela é removida tanto do banco quanto do disco.

5. **Ordenação**: As imagens sempre retornam ordenadas por `order` (crescente).

---

## 🔄 Migração de Produtos Existentes

Produtos que já existem continuam funcionando normalmente. Se um produto tem `imageUrl` mas não tem imagens no array `images`, você pode:

**Opção 1: Ignorar** - Mostrar apenas `imageUrl` no frontend se `images.length === 0`

**Opção 2: Migrar** - Criar script para copiar `imageUrl` para o array `images`:

```javascript
// Script de migração (rodar uma vez)
async function migrateExistingImages() {
  const products = await prisma.product.findMany({
    where: {
      imageUrl: { not: null },
      images: { none: {} } // Produtos que têm imageUrl mas não têm imagens no array
    }
  });

  for (const product of products) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl: product.imageUrl,
        order: 0
      }
    });
  }

  console.log(`${products.length} produtos migrados`);
}
```

---

## 📊 Resumo das Rotas

| Método | Rota | Descrição | Admin |
|--------|------|-----------|-------|
| GET | `/products/:id/images` | Listar imagens | Não |
| POST | `/products/:id/images` | Adicionar 1 imagem | Sim |
| POST | `/products/:id/images/multiple` | Adicionar várias imagens (até 10) | Sim |
| DELETE | `/products/:id/images/:imageId` | Deletar imagem | Sim |
| PUT | `/products/:id/images/reorder` | Reordenar imagens | Sim |

---

Se tiver dúvidas, me avisa! 🚀
