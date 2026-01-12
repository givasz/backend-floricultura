# API de Finalização de Pedido - Documentação Frontend

## Novos Campos Adicionados ao Carrinho

Foram adicionados os seguintes campos ao modelo `Cart` para suportar a finalização do pedido:

### Campos de Pagamento

- **paymentMethod** (String, opcional)
  - Valores aceitos: `"pix"`, `"credit_card"`, `"debit_card"`, `"cash"`
  - Forma de pagamento escolhida pelo cliente

- **needsChange** (Boolean, opcional, default: `false`)
  - Indica se o cliente precisa de troco (apenas para pagamento em dinheiro)
  - Só é relevante quando `paymentMethod === "cash"`

- **changeFor** (Float, opcional)
  - Valor para o qual o cliente precisa de troco
  - Exemplo: Se a compra deu R$ 47,50 e o cliente vai pagar com R$ 100,00, este campo deve ser `100.00`
  - Obrigatório quando `needsChange === true`

### Campos do Destinatário

- **recipientName** (String, opcional)
  - Nome completo do destinatário da entrega/pedido

- **recipientPhone** (String, opcional)
  - Número de telefone do destinatário

---

## Nova Rota: PATCH /api/carts/:uid/finalize

Esta é uma rota **pública** (não requer autenticação) para o cliente finalizar o pedido adicionando informações de pagamento e destinatário.

### Endpoint
```
PATCH /api/carts/:uid/finalize
```

### Parâmetros
- **uid** (URL param): ID único do carrinho

### Body (JSON)
```json
{
  "paymentMethod": "pix | credit_card | debit_card | cash",
  "needsChange": true,           // apenas se paymentMethod === "cash"
  "changeFor": 100.00,           // apenas se needsChange === true
  "recipientName": "Maria Silva",
  "recipientPhone": "(11) 98765-4321"
}
```

### Validações
1. `paymentMethod` deve ser um dos valores: `"pix"`, `"credit_card"`, `"debit_card"`, `"cash"`
2. Se `paymentMethod === "cash"` e `needsChange === true`, o campo `changeFor` é obrigatório
3. Se `paymentMethod !== "cash"`, os campos `needsChange` e `changeFor` são automaticamente definidos como `false` e `null`

### Exemplos de Uso

#### Exemplo 1: Pagamento via PIX
```javascript
const response = await fetch('/api/carts/abc12345/finalize', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethod: 'pix',
    recipientName: 'João Silva',
    recipientPhone: '(11) 91234-5678'
  })
});
```

#### Exemplo 2: Pagamento em Dinheiro COM Troco
```javascript
const response = await fetch('/api/carts/abc12345/finalize', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethod: 'cash',
    needsChange: true,
    changeFor: 100.00,
    recipientName: 'Maria Oliveira',
    recipientPhone: '(11) 98765-4321'
  })
});
```

#### Exemplo 3: Pagamento em Dinheiro SEM Troco (dinheiro trocado)
```javascript
const response = await fetch('/api/carts/abc12345/finalize', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethod: 'cash',
    needsChange: false,
    recipientName: 'Carlos Santos',
    recipientPhone: '(11) 99999-8888'
  })
});
```

#### Exemplo 4: Cartão de Crédito
```javascript
const response = await fetch('/api/carts/abc12345/finalize', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethod: 'credit_card',
    recipientName: 'Ana Paula',
    recipientPhone: '(11) 97777-6666'
  })
});
```

### Resposta de Sucesso (200)
```json
{
  "id": 1,
  "uid": "abc12345",
  "customerName": "Cliente Teste",
  "phone": "(11) 91111-2222",
  "note": "Entregar no portão",
  "deliveryMethod": "delivery",
  "address": "Rua das Flores, 123",
  "paymentMethod": "pix",
  "needsChange": false,
  "changeFor": null,
  "recipientName": "João Silva",
  "recipientPhone": "(11) 91234-5678",
  "items": [
    {
      "id": 1,
      "qty": 2,
      "price": 45.90,
      "product": {
        "id": 1,
        "name": "Buquê de Rosas",
        "description": "12 rosas vermelhas",
        "imageUrl": "https://...",
        "price": 45.90
      }
    }
  ],
  "createdAt": "2025-12-18T15:30:00.000Z",
  "updatedAt": "2025-12-18T15:35:00.000Z"
}
```

### Erros Possíveis

#### 400 - Método de pagamento inválido
```json
{
  "error": "Invalid payment method. Must be one of: pix, credit_card, debit_card, cash"
}
```

#### 400 - Troco sem valor
```json
{
  "error": "When needsChange is true, changeFor value is required"
}
```

#### 404 - Carrinho não encontrado
```json
{
  "error": "Carrinho não encontrado"
}
```

---

## Rotas Existentes Atualizadas

### POST /api/carts
Agora também aceita os novos campos no payload inicial:

```json
{
  "customerName": "Cliente Teste",
  "phone": "(11) 91111-2222",
  "note": "Observações",
  "deliveryMethod": "delivery",
  "address": "Rua das Flores, 123",
  "paymentMethod": "pix",
  "needsChange": false,
  "changeFor": null,
  "recipientName": "João Silva",
  "recipientPhone": "(11) 91234-5678",
  "items": [
    { "productId": 1, "qty": 2 }
  ]
}
```

### GET /api/carts/:uid
Agora retorna também os novos campos na resposta.

### PUT /api/carts/:uid (Admin)
Rota administrativa agora também permite atualizar os novos campos.

---

## Sugestão de Fluxo no Frontend

1. **Página do Carrinho Inicial**: Cliente adiciona produtos
2. **Página de Dados de Entrega**: Cliente preenche nome, telefone, método de entrega, endereço
3. **Página de Finalização**: Cliente preenche:
   - Método de pagamento (radio buttons ou select)
   - Se "Dinheiro": mostrar checkbox "Precisa de troco?" e input para valor
   - Nome do destinatário
   - Telefone do destinatário
4. **Enviar**: Fazer `PATCH /api/carts/:uid/finalize` com os dados
5. **Confirmação**: Mostrar resumo do pedido finalizado

---

## Checklist de Implementação Frontend

- [ ] Criar componente de seleção de forma de pagamento
  - [ ] Radio button ou select com opções: PIX, Cartão de Crédito, Cartão de Débito, Dinheiro
- [ ] Adicionar lógica condicional para pagamento em dinheiro
  - [ ] Checkbox "Precisa de troco?"
  - [ ] Input numérico para valor do troco (apenas se checkbox marcado)
- [ ] Adicionar campos de destinatário
  - [ ] Input para nome do destinatário
  - [ ] Input para telefone do destinatário (com máscara)
- [ ] Validação do formulário
  - [ ] Método de pagamento obrigatório
  - [ ] Se dinheiro + troco, valor obrigatório
  - [ ] Nome e telefone do destinatário obrigatórios
- [ ] Implementar chamada à API `PATCH /api/carts/:uid/finalize`
- [ ] Tratar erros da API
- [ ] Exibir confirmação de pedido finalizado

---

## Labels Sugeridos para UI

### Português
- **Forma de Pagamento**: "Como você vai pagar?"
- **PIX**: "PIX"
- **Cartão de Crédito**: "Cartão de Crédito"
- **Cartão de Débito**: "Cartão de Débito"
- **Dinheiro**: "Dinheiro"
- **Precisa de troco?**: "Vai precisar de troco?"
- **Troco para quanto?**: "Troco para quanto? (R$)"
- **Nome do Destinatário**: "Nome de quem vai receber"
- **Telefone do Destinatário**: "Telefone de quem vai receber"

---

## Observações Importantes

1. Todos os novos campos são **opcionais** no banco de dados
2. A validação de `paymentMethod` aceita apenas os 4 valores especificados
3. A lógica de troco é automaticamente zerada se o método não for "cash"
4. A rota `/finalize` é pública - não precisa de token de admin
5. Recomenda-se fazer a chamada ao `/finalize` apenas quando o cliente clicar em "Finalizar Pedido"
