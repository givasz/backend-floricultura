# Guia de Integração Front-end

## 🚨 AÇÃO IMEDIATA NECESSÁRIA

**REMOVER IMEDIATAMENTE do .env do front-end:**
- `ADMIN_ROUTE`
- `ADMIN_USER` / `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DATABASE_URL`
- Qualquer outra variável sensível do backend

Essas variáveis agora estão seguras **EXCLUSIVAMENTE** no backend.

---

## 🔐 Nova Arquitetura de Autenticação

### Fluxo Completo

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  Front-end  │  Login  │   Backend   │  Valida │  Variáveis   │
│             │────────>│             │────────>│  de Ambiente │
│             │<────────│             │         │              │
│  Recebe     │ Success │  Retorna    │         │  ADMIN_USER  │
│  adminRoute │         │  adminRoute │         │  ADMIN_PASS  │
└─────────────┘         └─────────────┘         │  ADMIN_ROUTE │
                                                 └──────────────┘
```

---

## 📋 Implementação no Front-end

### 1. Criar Componente de Login Admin

```jsx
// src/pages/AdminLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Armazenar dados de autenticação
        sessionStorage.setItem('adminAuth', JSON.stringify({
          email: data.user.email,
          adminRoute: data.adminRoute,
          credentials: btoa(`${email}:${password}`) // Base64 para Basic Auth
        }));

        // Redirecionar para painel admin
        navigate(data.adminRoute);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h1>Login Administrativo</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
```

### 2. Criar Hook para Requisições Autenticadas

```jsx
// src/hooks/useAdminApi.js
import { useNavigate } from 'react-router-dom';

export function useAdminApi() {
  const navigate = useNavigate();

  const getAuthData = () => {
    const authData = sessionStorage.getItem('adminAuth');
    if (!authData) {
      navigate('/admin/login');
      return null;
    }
    return JSON.parse(authData);
  };

  const fetchProtected = async (endpoint, options = {}) => {
    const authData = getAuthData();
    if (!authData) return;

    const response = await fetch(`http://localhost:3000${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Basic ${authData.credentials}`,
      },
    });

    if (response.status === 401) {
      // Token expirado ou inválido
      sessionStorage.removeItem('adminAuth');
      navigate('/admin/login');
      throw new Error('Sessão expirada');
    }

    return response;
  };

  return { fetchProtected, getAuthData };
}
```

### 3. Componente do Painel Admin

```jsx
// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { useAdminApi } from '../hooks/useAdminApi';

export default function AdminPanel() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchProtected, getAuthData } = useAdminApi();

  useEffect(() => {
    loadCarts();
  }, []);

  const loadCarts = async () => {
    try {
      const authData = getAuthData();
      if (!authData) return;

      // Usar a rota dinâmica recebida no login
      const response = await fetchProtected(
        `${authData.adminRoute}/carrinhos?page=1&limit=20`
      );

      const data = await response.json();
      setCarts(data.data);
    } catch (error) {
      console.error('Erro ao carregar carrinhos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="admin-panel">
      <h1>Painel Administrativo</h1>
      <h2>Carrinhos ({carts.length})</h2>
      <div className="carts-list">
        {carts.map(cart => (
          <div key={cart.id} className="cart-item">
            <p><strong>Cliente:</strong> {cart.customerName}</p>
            <p><strong>Telefone:</strong> {cart.phone}</p>
            <p><strong>Método:</strong> {cart.deliveryMethod}</p>
            {/* Renderizar mais dados conforme necessário */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Configurar Rotas

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-route-k92lx" element={<AdminPanel />} />
        {/* Ou usar rota dinâmica: */}
        <Route path="/admin-*" element={<AdminPanel />} />
        {/* Outras rotas... */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔒 Exemplo de Uso em Produção

### Configuração do .env no Front-end (Apenas URLs públicas)

```env
# .env (front-end) - APENAS URLs públicas
VITE_API_URL=https://api.seudominio.com
VITE_FRONTEND_URL=https://seudominio.com
```

### Upload de Imagem Hero (Rota Protegida)

```jsx
const uploadHeroImage = async (file) => {
  const authData = getAuthData();
  if (!authData) return;

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetchProtected('/config/upload-image', {
    method: 'POST',
    body: formData,
    // Não incluir Content-Type - deixar o browser definir com boundary
  });

  const data = await response.json();
  return data;
};
```

---

## ✅ Checklist de Segurança

### No Front-end
- [ ] Remover todas as variáveis sensíveis do .env
- [ ] Implementar tela de login que chama `/api/admin/login`
- [ ] Armazenar `adminRoute` e credenciais em sessionStorage (não localStorage)
- [ ] Usar `adminRoute` dinâmico para acessar rotas protegidas
- [ ] Enviar credenciais via Basic Auth em todas as requisições protegidas
- [ ] Implementar logout que limpa sessionStorage
- [ ] Redirecionar para login se receber 401

### No Backend (Já implementado)
- [x] Todas as variáveis sensíveis no .env do backend
- [x] Rota `/api/admin/login` pública e funcional
- [x] Validação robusta de req.body
- [x] Middleware adminAuth com Basic Auth
- [x] Retorno consistente de erros HTTP
- [x] Validação de variáveis de ambiente ao iniciar

---

## 🧪 Testando a Integração

### 1. Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Giovannasalgueiroaguiar@gmail.com","password":"Pv!181178"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "adminRoute": "/admin-route-k92lx",
  "user": {
    "email": "Giovannasalgueiroaguiar@gmail.com"
  }
}
```

### 2. Acessar Rota Protegida
```bash
# Gerar Basic Auth
echo -n "email:senha" | base64
# Resultado: R2lvdmFubmFzYWxndWVpcm9hZ3VpYXJAZ21haWwuY29tOlB2ITE4MTE3OA==

curl -X GET http://localhost:3000/admin-route-k92lx/carrinhos \
  -H "Authorization: Basic R2lvdmFubmFzYWxndWVpcm9hZ3VpYXJAZ21haWwuY29tOlB2ITE4MTE3OA=="
```

---

## 🚀 Deploy em Produção

### URLs em Produção (exemplo)

```jsx
// src/config/api.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Usar em componentes
const response = await fetch(`${API_URL}/api/admin/login`, { ... });
```

### Variáveis de Ambiente Netlify/Vercel

```
VITE_API_URL=https://api.seudominio.com
```

---

## 📞 Troubleshooting

### Erro: "Network request failed"
- Verificar se o backend está rodando
- Verificar URL da API
- Verificar CORS no backend

### Erro: "Email ou senha incorretos"
- Verificar credenciais exatas (case-sensitive)
- Verificar se variáveis estão no .env do backend

### Erro: "Autenticação necessária"
- Verificar se o header Authorization está sendo enviado
- Verificar formato: `Basic base64(email:password)`

### Sessão perdida ao recarregar página
- Usar `sessionStorage` para manter durante a sessão
- Implementar "lembrar-me" com `localStorage` se necessário

---

## 🎯 Próximos Passos

1. Implementar tela de login no front-end
2. Testar fluxo completo de autenticação
3. Implementar proteção de rotas no front-end
4. Adicionar logout funcional
5. Testar em produção com URLs reais
6. Implementar renovação automática de sessão (opcional)

---

## 📚 Referências

- Documentação completa: [SECURITY_ARCHITECTURE.md](./SECURITY_ARCHITECTURE.md)
- Código backend: [src/routes/admin.js](./src/routes/admin.js)
- Middleware: [src/middlewares/adminAuth.js](./src/middlewares/adminAuth.js)
