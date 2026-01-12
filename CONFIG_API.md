# API de Configuração - Documentação

## Visão Geral

A API de configuração permite gerenciar as configurações globais da aplicação, começando com a imagem do hero da página inicial.

## Modelo de Dados

```typescript
interface Config {
  id: number;
  heroImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Endpoints

### GET /config

Retorna as configurações atuais da aplicação.

**Acesso:** Público (não requer autenticação)

**Exemplo de Requisição:**
```bash
curl http://localhost:3000/config
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "heroImageUrl": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop",
  "createdAt": "2025-12-18T19:29:43.046Z",
  "updatedAt": "2025-12-18T19:29:43.046Z"
}
```

---

### PUT /config

Atualiza as configurações da aplicação.

**Acesso:** Requer autenticação (Bearer token)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {ADMIN_TOKEN}
```

**Body:**
```json
{
  "heroImageUrl": "https://example.com/new-hero-image.jpg"
}
```

**Exemplo de Requisição:**
```bash
curl -X PUT http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1986" \
  -d '{"heroImageUrl":"https://example.com/new-hero-image.jpg"}'
```

**Resposta (200 OK):**
```json
{
  "id": 1,
  "heroImageUrl": "https://example.com/new-hero-image.jpg",
  "createdAt": "2025-12-18T19:29:43.046Z",
  "updatedAt": "2025-12-18T19:31:18.900Z"
}
```

**Resposta de Erro (401 Unauthorized):**
```json
{
  "error": "Unauthorized (admin only)"
}
```

---

## Comportamento Especial

### Inicialização Automática

- Se não existir nenhum registro de configuração no banco de dados, o endpoint GET cria automaticamente um com valores padrão
- O script de seed (`npm run seed`) também cria a configuração inicial se ela não existir
- Sempre haverá exatamente **um único** registro de configuração no sistema

### Atualização vs Criação

- O endpoint PUT sempre atualiza o registro existente
- Se por algum motivo não existir configuração, o PUT cria uma nova
- Não é possível ter múltiplos registros de configuração

---

## Integração com Frontend

### Carregar Configurações (Página Inicial)

```javascript
// React/Vue/Angular - Carregar configurações ao montar o componente
useEffect(() => {
  fetch('/config')
    .then(res => res.json())
    .then(config => {
      setHeroImageUrl(config.heroImageUrl);
    });
}, []);
```

### Atualizar Configurações (Painel Admin)

```javascript
// React/Vue/Angular - Atualizar configurações
const updateConfig = async (newHeroImageUrl) => {
  const response = await fetch('/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      heroImageUrl: newHeroImageUrl
    })
  });

  if (response.ok) {
    const updatedConfig = await response.json();
    console.log('Configuração atualizada!', updatedConfig);
  } else {
    const error = await response.json();
    console.error('Erro ao atualizar:', error.error);
  }
};
```

---

## Exemplo Completo de Componente Admin (React)

```jsx
import { useState, useEffect } from 'react';

function ConfigSettings() {
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar configuração atual
  useEffect(() => {
    fetch('/config')
      .then(res => res.json())
      .then(config => setHeroImageUrl(config.heroImageUrl || ''));
  }, []);

  // Atualizar configuração
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ heroImageUrl })
      });

      if (response.ok) {
        alert('Configurações atualizadas com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      alert('Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>URL da Imagem Hero:</label>
        <input
          type="url"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://example.com/hero.jpg"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </form>
  );
}

export default ConfigSettings;
```

---

## Teste Manual

### 1. Obter configuração atual
```bash
curl http://localhost:3000/config
```

### 2. Atualizar configuração (com autenticação)
```bash
curl -X PUT http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 1986" \
  -d '{"heroImageUrl":"https://new-image.jpg"}'
```

### 3. Tentar atualizar sem autenticação (deve falhar)
```bash
curl -X PUT http://localhost:3000/config \
  -H "Content-Type: application/json" \
  -d '{"heroImageUrl":"https://new-image.jpg"}'
```

---

## Notas de Implementação

### Backend
- ✅ Modelo `Config` criado no Prisma schema
- ✅ Migration aplicada ao banco de dados
- ✅ Seed script para criar configuração inicial
- ✅ Endpoint GET público implementado
- ✅ Endpoint PUT protegido por autenticação
- ✅ Rotas registradas em [src/index.js:22](src/index.js#L22)

### Arquivos Criados/Modificados
- `prisma/schema.prisma` - Adicionado modelo Config
- `prisma/seed.js` - Script de seed para configuração inicial
- `src/routes/config.js` - Rotas de configuração
- `src/index.js` - Registro das rotas
- `package.json` - Script de seed adicionado

### Comandos Úteis
```bash
# Executar seed
npm run seed

# Aplicar migrations
npm run migrate

# Iniciar servidor
npm start
```
