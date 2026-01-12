# ✅ Upload de Imagens Implementado!

## O que foi feito:

1. **Instalado `multer`** - biblioteca para upload de arquivos
2. **Criado middleware de upload** em `src/middleware/upload.js`
3. **Configurado pasta `uploads/`** para salvar as imagens (já no .gitignore)
4. **Adicionado rotas de upload** em produtos e categorias
5. **Documentação completa** para o frontend em `UPLOAD_IMAGES_API.md`

---

## 🎯 Para o Claude do Frontend:

**Envie este arquivo:** `UPLOAD_IMAGES_API.md`

O arquivo contém:
- ✅ Todas as rotas disponíveis
- ✅ Exemplos completos de código React
- ✅ Duas opções de implementação (2 passos ou tudo junto)
- ✅ Preview de imagem antes de enviar
- ✅ Validações de tamanho
- ✅ Como funcionar no mobile (câmera + galeria)
- ✅ Instruções para produção (Hostinger)

---

## 🔥 Rotas Principais:

### Produtos:
- `POST /products/upload-image` - Upload apenas a imagem
- `POST /products/with-image` - Criar produto + imagem junto
- `PUT /products/:id/with-image` - Editar produto + trocar imagem

### Categorias:
- `POST /categories/upload-image` - Upload apenas a imagem
- `POST /categories/with-image` - Criar categoria + imagem junto
- `PUT /categories/:id/with-image` - Editar categoria + trocar imagem

---

## 📁 Estrutura Criada:

```
uploads/
├── products/       ← Imagens dos produtos
└── categories/     ← Imagens das categorias
```

**Acesso público:** `http://localhost:3000/uploads/products/nome-arquivo.jpg`

---

## ⚙️ Configurações:

- **Formatos aceitos:** JPEG, PNG, GIF, WebP
- **Tamanho máximo:** 5MB
- **Nomes únicos:** Gerados automaticamente
- **Deleção automática:** Imagens antigas são deletadas ao atualizar
- **Apenas admin:** Precisa de token JWT

---

## 🚀 Próximos Passos (para você):

1. Envie `UPLOAD_IMAGES_API.md` para o Claude do frontend
2. Ele vai atualizar os formulários de produto/categoria
3. Teste local primeiro
4. Quando for pra Hostinger, garanta permissões na pasta `uploads/`:
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/products/
   chmod 755 uploads/categories/
   ```

---

## 💡 Dicas:

- As rotas antigas (`POST /products` com `imageUrl` como string) **continuam funcionando**
- Você pode misturar: alguns produtos com URL externa, outros com upload
- No mobile, o input de arquivo já oferece opção de câmera automaticamente
- Configure backup da pasta `uploads/` (ela não vai pro Git!)

---

**Tudo pronto! 🎉** Agora é só o frontend implementar e testar!
