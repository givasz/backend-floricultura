# Arquitetura de Segurança - Painel Administrativo

## 🔐 IMPORTANTE: Variáveis de Ambiente

Todas as credenciais administrativas devem estar **EXCLUSIVAMENTE** no `.env` do **BACKEND**.

### Variáveis Obrigatórias no Backend (.env)

```env
DATABASE_URL="postgresql://admin:admin123@localhost:5432/mydb?schema=public"
PORT=3000
APP_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Credenciais de administrador (NUNCA expor ao front-end)
ADMIN_ROUTE=/admin-route-k92lx
ADMIN_USER=Giovannasalgueiroaguiar@gmail.com
ADMIN_PASSWORD=Pv!181178
```

### ⚠️ O que NÃO deve estar no front-end

- `ADMIN_ROUTE` - Rota secreta
- `ADMIN_USER` - Email do administrador
- `ADMIN_PASSWORD` - Senha do administrador
- `DATABASE_URL` - String de conexão do banco
- Qualquer outra credencial sensível

---

## 🏗️ Fluxo de Autenticação

### 1. Login do Administrador

**Endpoint:** `POST /api/admin/login`

**Request (Front-end envia):**
```json
{
  "email": "email@example.com",
  "password": "senha123"
}
```

**Response em caso de sucesso (200):**
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

**Response em caso de falha (401):**
```json
{
  "success": false,
  "error": "Email ou senha incorretos"
}
```

### 2. Acesso a Rotas Protegidas

Após o login bem-sucedido, o front-end recebe `adminRoute` e deve:

1. Armazenar temporariamente o `adminRoute` (ex: localStorage, sessionStorage)
2. Enviar credenciais via **Basic Auth** nas requisições protegidas

**Exemplo de requisição protegida:**
```http
GET /admin-route-k92lx/carrinhos
Authorization: Basic base64(email:password)
```

---

## 🛡️ Segurança Implementada

### Validações no Backend

1. **Validação de req.body:**
   - Verifica se req.body existe e é um objeto
   - Verifica se email e password foram enviados
   - Retorna erro 400 se inválido

2. **Validação de variáveis de ambiente:**
   - Verifica se ADMIN_USER, ADMIN_PASSWORD e ADMIN_ROUTE estão configurados
   - Retorna erro 500 se não configurado
   - Encerra o servidor se ADMIN_ROUTE estiver ausente

3. **Comparação de credenciais:**
   - Comparação case-sensitive
   - Sem exposição de informações sensíveis em caso de erro

4. **Middleware adminAuth:**
   - Suporta autenticação Basic Auth
   - Valida credenciais contra process.env
   - Retorna 401 para credenciais inválidas

### Proteções Contra Ataques

- ✅ Credenciais nunca expostas ao front-end
- ✅ Rota administrativa aleatória/secreta
- ✅ Validação robusta de entrada
- ✅ Respostas HTTP consistentes
- ✅ Logs de erros (sem expor dados sensíveis)

---

## 🚀 Deploy em Produção (Hostinger)

### Configuração do .env em Produção

```env
DATABASE_URL="postgresql://user:pass@host:5432/prod_db?schema=public"
PORT=3000
APP_BASE_URL=https://seu-dominio.com
FRONTEND_URL=https://seu-frontend.com

ADMIN_ROUTE=/admin-route-SUPER-SECRETO-AQUI
ADMIN_USER=email@real.com
ADMIN_PASSWORD=SenhaForteAqui123!@#
```

### Checklist de Deploy

- [ ] Atualizar variáveis de ambiente no painel da Hostinger
- [ ] Usar URLs de produção (não localhost)
- [ ] Trocar ADMIN_ROUTE por valor único e secreto
- [ ] Usar senha forte em ADMIN_PASSWORD
- [ ] Configurar CORS para aceitar apenas o domínio do front-end
- [ ] Verificar que .env está no .gitignore
- [ ] Testar login admin após deploy

---

## 📋 Rotas Disponíveis

### Públicas
- `GET /health` - Health check
- `POST /api/admin/login` - Login administrativo

### Protegidas (requer Basic Auth)
- `GET ${ADMIN_ROUTE}/carrinhos` - Lista todos os carrinhos (paginado)
- `POST /config/upload-image` - Upload de imagem hero
- `PUT /config` - Atualizar configurações

---

## 🧪 Testando Localmente

### 1. Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "Giovannasalgueiroaguiar@gmail.com",
    "password": "Pv!181178"
  }'
```

### 2. Acessar Rota Protegida
```bash
curl -X GET http://localhost:3000/admin-route-k92lx/carrinhos \
  -H "Authorization: Basic $(echo -n 'Giovannasalgueiroaguiar@gmail.com:Pv!181178' | base64)"
```

---

## 🔧 Troubleshooting

### Erro: "req.body is undefined"
- **Causa:** Middlewares de parsing não configurados
- **Solução:** Verificar que `express.json()` e `express.urlencoded()` estão em `server.js`

### Erro: "Cannot read property 'email' of undefined"
- **Causa:** req.body não existe ou está vazio
- **Solução:** Implementada validação de req.body antes de acessar propriedades

### Erro: "Unauthorized (admin only)"
- **Causa:** Credenciais incorretas ou header Authorization ausente
- **Solução:** Verificar que email/password estão corretos e header está no formato `Basic base64(email:password)`

### Erro: "Configuração do servidor incompleta"
- **Causa:** Variáveis ADMIN_USER, ADMIN_PASSWORD ou ADMIN_ROUTE não configuradas
- **Solução:** Verificar arquivo .env e reiniciar servidor

---

## 📝 Alterações Realizadas

### Arquivos Modificados

1. **`.env`** - Adicionadas todas as variáveis sensíveis
2. **`src/routes/admin.js`** (NOVO) - Rota de login segura
3. **`src/middlewares/adminAuth.js`** - Melhorada validação e tratamento de erros
4. **`src/server.js`** - Adicionados middlewares de parsing
5. **`src/index.js`** - Registrada rota `/api/admin` e validação de ADMIN_ROUTE

### O que foi corrigido

- ✅ Todas as variáveis sensíveis migradas para o backend
- ✅ Rota de login `/api/admin/login` implementada
- ✅ Validação robusta de req.body
- ✅ Middleware adminAuth melhorado
- ✅ Respostas HTTP consistentes (200, 401, 403, 500)
- ✅ Logs de erro sem expor dados sensíveis
- ✅ Validação de variáveis de ambiente ao iniciar servidor
- ✅ Proteção contra acesso de propriedades undefined

---

## 🎯 Próximos Passos (Front-end)

O front-end precisa ser ajustado para:

1. **Remover todas as variáveis sensíveis do .env do front-end**
2. **Implementar tela de login que:**
   - Envia POST para `/api/admin/login`
   - Recebe `adminRoute` na resposta
   - Armazena `adminRoute` temporariamente
3. **Usar `adminRoute` recebido para acessar rotas protegidas**
4. **Enviar credenciais via Basic Auth nas requisições protegidas**

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verificar:
1. Console do servidor para erros
2. Variáveis de ambiente configuradas
3. Formato do header Authorization
4. Credenciais corretas
