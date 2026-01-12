# API de Upload de Imagens - Documentação para o Frontend

O backend agora suporta **upload REAL de imagens** direto do celular/PC! Não precisa mais usar URLs externas.

## 📋 Resumo

- ✅ Upload de arquivos (JPEG, PNG, GIF, WebP)
- ✅ Tamanho máximo: 5MB por arquivo
- ✅ Imagens salvas em `/uploads/products/` e `/uploads/categories/`
- ✅ Acesso público via: `http://localhost:3000/uploads/products/nome-arquivo.jpg`
- ✅ Deleção automática de imagens antigas ao atualizar
- ✅ Apenas administradores podem fazer upload
- ✅ Funciona em qualquer hospedagem (Hostinger, DigitalOcean, etc.)

---

## 🚀 Como Funciona

Existem **duas formas** de trabalhar com imagens:

### **Opção 1: Upload em 2 Passos (RECOMENDADO para UX)**
1. Usuário seleciona a imagem → envia para `/upload-image`
2. Backend retorna a URL da imagem
3. Usuário preenche os outros campos do formulário
4. Envia tudo (incluindo a URL da imagem) para a rota normal de criar/editar

### **Opção 2: Upload Tudo Junto**
1. Usuário preenche formulário E seleciona imagem
2. Envia tudo de uma vez para `/with-image`
3. Backend salva imagem e cria/atualiza o produto/categoria

---

## 📦 Rotas Disponíveis

### **Produtos**

#### 1. Upload Apenas a Imagem
```http
POST /products/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- image: [arquivo]
```

**Resposta:**
```json
{
  "message": "Imagem enviada com sucesso",
  "imageUrl": "/uploads/products/buque-rosas-1734567890123-456789.jpg"
}
```

---

#### 2. Criar Produto COM Upload de Imagem
```http
POST /products/with-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- name: "Buquê de Rosas"
- description: "Rosas vermelhas lindas"
- price: "89.90"
- categoryIds: "[2, 5]"  ← STRING com JSON array
- active: "true"
- image: [arquivo]
```

**Resposta:**
```json
{
  "id": 1,
  "name": "Buquê de Rosas",
  "description": "Rosas vermelhas lindas",
  "price": 89.90,
  "imageUrl": "/uploads/products/buque-rosas-1734567890123-456789.jpg",
  "active": true,
  "categories": [...]
}
```

---

#### 3. Atualizar Produto COM Upload de Imagem
```http
PUT /products/:id/with-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- name: "Buquê de Rosas Brancas"
- price: "99.90"
- categoryIds: "[2, 7]"
- image: [arquivo]  ← OPCIONAL (se não enviar, mantém a imagem antiga)
```

**Importante:** Se enviar uma nova imagem, a antiga será **deletada automaticamente** do servidor.

---

### **Categorias**

#### 1. Upload Apenas a Imagem
```http
POST /categories/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- image: [arquivo]
```

---

#### 2. Criar Categoria COM Upload
```http
POST /categories/with-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- name: "Buquês"
- image: [arquivo]
```

---

#### 3. Atualizar Categoria COM Upload
```http
PUT /categories/:id/with-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
- name: "Buquês Premium"
- image: [arquivo]  ← OPCIONAL
```

---

## 💻 Código React - Exemplos Completos

### **Exemplo 1: Upload em 2 Passos (Melhor UX)**

```jsx
import { useState } from 'react';

function ProductForm() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // URL retornada pelo backend
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Passo 1: Upload da imagem
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/products/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImageUrl(data.imageUrl); // Salva a URL
        alert('Imagem enviada com sucesso!');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  // Passo 2: Criar produto (com a URL da imagem)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          imageUrl, // URL retornada no passo 1
          categoryIds: [1, 2],
          active: true
        })
      });

      if (response.ok) {
        alert('Produto criado com sucesso!');
      }
    } catch (error) {
      alert('Erro ao criar produto');
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
        <label>Imagem:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploadingImage}
        />
        {uploadingImage && <p>Enviando imagem...</p>}
        {imageUrl && (
          <div>
            <p>✓ Imagem enviada!</p>
            <img
              src={`http://localhost:3000${imageUrl}`}
              alt="Preview"
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      <button type="submit" disabled={!imageUrl || uploadingImage}>
        Criar Produto
      </button>
    </form>
  );
}
```

---

### **Exemplo 2: Upload Tudo Junto (Mais Simples)**

```jsx
import { useState } from 'react';

function ProductFormSimple() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [categoryIds, setCategoryIds] = useState([1, 2]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('categoryIds', JSON.stringify(categoryIds)); // ← Importante: enviar como JSON string
    formData.append('active', 'true');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/products/with-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // NÃO envie Content-Type quando usar FormData!
        },
        body: formData
      });

      if (response.ok) {
        const product = await response.json();
        alert('Produto criado com sucesso!');
        console.log(product);
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert('Erro ao criar produto');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="number"
        step="0.01"
        placeholder="Preço"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <button type="submit">Criar Produto</button>
    </form>
  );
}
```

---

### **Exemplo 3: Editar Produto (Com Nova Imagem)**

```jsx
function EditProductForm({ productId }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);

  // Carregar produto existente
  useEffect(() => {
    fetch(`/products/${productId}`)
      .then(res => res.json())
      .then(product => {
        setName(product.name);
        setPrice(product.price);
        setCurrentImageUrl(product.imageUrl);
      });
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('categoryIds', JSON.stringify([1, 2]));

    // Se selecionou nova imagem, envia
    if (newImageFile) {
      formData.append('image', newImageFile);
    }

    try {
      const response = await fetch(`/products/${productId}/with-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Produto atualizado com sucesso!');
      }
    } catch (error) {
      alert('Erro ao atualizar produto');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <div>
        <p>Imagem atual:</p>
        {currentImageUrl && (
          <img
            src={`http://localhost:3000${currentImageUrl}`}
            alt="Atual"
            style={{ width: 100 }}
          />
        )}
      </div>

      <div>
        <label>Nova imagem (opcional):</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewImageFile(e.target.files[0])}
        />
        {newImageFile && <p>✓ Nova imagem selecionada</p>}
      </div>

      <button type="submit">Salvar Alterações</button>
    </form>
  );
}
```

---

## 🎨 Preview de Imagem Antes de Enviar

```jsx
function ImagePreview() {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cria URL temporária para preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  useEffect(() => {
    // Limpa a URL quando o componente desmonta
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      {preview && (
        <img
          src={preview}
          alt="Preview"
          style={{ width: 200, height: 200, objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
```

---

## ⚠️ Coisas Importantes

### 1. **`categoryIds` DEVE ser uma STRING JSON**

```jsx
// ❌ ERRADO
formData.append('categoryIds', [1, 2, 3]);

// ✅ CORRETO
formData.append('categoryIds', JSON.stringify([1, 2, 3]));
```

### 2. **NÃO envie `Content-Type` quando usar FormData**

```jsx
// ❌ ERRADO
fetch('/products/with-image', {
  headers: {
    'Content-Type': 'multipart/form-data', // ← NÃO faça isso!
    'Authorization': 'Bearer ...'
  },
  body: formData
});

// ✅ CORRETO
fetch('/products/with-image', {
  headers: {
    'Authorization': 'Bearer ...'
    // Content-Type é definido automaticamente pelo browser
  },
  body: formData
});
```

### 3. **Aceitar apenas imagens no input**

```jsx
<input
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp"
  // ou simplesmente:
  accept="image/*"
/>
```

### 4. **Validação de tamanho no frontend**

```jsx
const handleFileChange = (e) => {
  const file = e.target.files[0];

  if (!file) return;

  // Limite de 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('Arquivo muito grande! Máximo: 5MB');
    e.target.value = ''; // Limpa o input
    return;
  }

  // Continua o upload...
};
```

---

## 🌐 Como Funciona em Produção (Hostinger)

Quando você subir o backend para a Hostinger:

1. As imagens ficam salvas em `/uploads/` no servidor
2. São acessíveis via: `https://seudominio.com/uploads/products/imagem.jpg`
3. **IMPORTANTE:** Garanta que a pasta `uploads/` tem permissão de escrita:
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/products/
   chmod 755 uploads/categories/
   ```

4. **Backup:** Configure backups automáticos da pasta `uploads/` (não está no Git!)

---

## 📱 Mobile - Capturar Foto da Câmera

No mobile, o input `type="file"` com `accept="image/*"` automaticamente oferece a opção de:
- 📷 Tirar foto com a câmera
- 🖼️ Escolher da galeria

```jsx
<input
  type="file"
  accept="image/*"
  capture="environment" // Prioriza câmera traseira
  onChange={handleFileChange}
/>
```

---

## 🔐 Segurança

- ✅ Apenas administradores autenticados podem fazer upload
- ✅ Apenas formatos de imagem permitidos (JPEG, PNG, GIF, WebP)
- ✅ Tamanho máximo: 5MB
- ✅ Nomes de arquivo sanitizados (remove caracteres especiais)
- ✅ Nomes únicos gerados automaticamente (evita sobrescrever)

---

## 🛠️ Testando com curl

```bash
# Upload apenas imagem
curl -X POST http://localhost:3000/products/upload-image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@/caminho/para/imagem.jpg"

# Criar produto com imagem
curl -X POST http://localhost:3000/products/with-image \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "name=Buquê de Rosas" \
  -F "price=89.90" \
  -F "categoryIds=[1,2]" \
  -F "active=true" \
  -F "image=@/caminho/para/imagem.jpg"
```

---

## ❓ Dúvidas Frequentes

**P: Posso continuar usando URLs externas (Unsplash, etc.)?**
R: Sim! As rotas normais (`POST /products`, `PUT /products/:id`) ainda funcionam com `imageUrl` como string.

**P: O que acontece se eu não enviar imagem?**
R: O produto/categoria é criado normalmente, mas com `imageUrl: null`.

**P: Posso trocar a imagem depois?**
R: Sim! Use `PUT /products/:id/with-image` enviando uma nova imagem. A antiga será deletada automaticamente.

**P: As imagens antigas são deletadas?**
R: Sim, quando você atualiza um produto/categoria com nova imagem, a antiga é deletada do servidor automaticamente.

---

## 📝 Resumo das Rotas

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| POST | `/products/upload-image` | Upload apenas imagem | `multipart/form-data` |
| POST | `/products/with-image` | Criar produto + imagem | `multipart/form-data` |
| PUT | `/products/:id/with-image` | Editar produto + imagem | `multipart/form-data` |
| POST | `/categories/upload-image` | Upload apenas imagem | `multipart/form-data` |
| POST | `/categories/with-image` | Criar categoria + imagem | `multipart/form-data` |
| PUT | `/categories/:id/with-image` | Editar categoria + imagem | `multipart/form-data` |

---

Se tiver dúvidas, me avisa! 🚀
