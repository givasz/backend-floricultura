const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");
const { upload, deleteOldImage } = require("../middleware/upload");

// ============================================================
// ROTAS DE UPLOAD DE IMAGEM (devem vir ANTES das outras rotas)
// ============================================================

// Upload de imagem para produto (apenas admin)
// POST /products/upload-image
router.post("/upload-image", adminAuth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    // Retorna a URL da imagem que foi salva
    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.status(201).json({
      message: "Imagem enviada com sucesso",
      imageUrl
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Criar produto COM upload de imagem (apenas admin)
// POST /products/with-image
// Suporta: multipart/form-data com campos: image (file), name, description, price, categoryIds (JSON string), active
router.post("/with-image", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, categoryIds, active } = req.body;

    // Parse categoryIds se vier como string JSON
    let parsedCategoryIds = [];
    if (categoryIds) {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch {
        parsedCategoryIds = categoryIds;
      }
    }

    // Gera URL da imagem se foi enviada
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        active: active !== undefined ? (active === "true" || active === true) : true,
        categories: parsedCategoryIds && parsedCategoryIds.length > 0 ? {
          create: parsedCategoryIds.map(catId => ({
            categoryId: parseInt(catId)
          }))
        } : undefined,
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// ROTAS NORMAIS (JSON)
// ============================================================

// Criar produto (apenas admin)
router.post("/", adminAuth, async (req, res) => {
  const { name, description, price, imageUrl, categoryIds, active } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        active: active !== undefined ? !!active : true,
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map(catId => ({
            categoryId: parseInt(catId)
          }))
        } : undefined,
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar produtos (público, com filtros opcionais e paginação)
router.get("/", async (req, res) => {
  try {
    const {
      category,
      active,
      page = "1",
      limit = "10",
      paginated = "true"
    } = req.query;

    const where = {};

    if (category) {
      where.categories = {
        some: {
          categoryId: parseInt(category)
        }
      };
    }

    if (active !== undefined && active !== "")
      where.active = active === "true";

    // 🔥 Converte page/limit de forma segura
    const pageNum = Number.isFinite(parseInt(page)) ? parseInt(page) : 1;
    const limitNum = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 10;

    if (paginated === "false") {
      const products = await prisma.product.findMany({
        where,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          images: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { id: "desc" },
      });

      return res.json(products);
    }

    const skip = (pageNum - 1) * limitNum;

    const products = await prisma.product.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      },
      skip,
      take: limitNum,
      orderBy: { id: "desc" },
    });

    const total = await prisma.product.count({ where });

    res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.log("PRODUCT ERROR:", error);
    res.status(400).json({ error: error.message });
  }
});

// Buscar produto por ID (público)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      },
    });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar produto COM upload de imagem (apenas admin)
// PUT /products/:id/with-image
router.put("/:id/with-image", adminAuth, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  try {
    const { name, description, price, categoryIds, active } = req.body;

    // Parse categoryIds se vier como string JSON
    let parsedCategoryIds = [];
    if (categoryIds) {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch {
        parsedCategoryIds = categoryIds;
      }
    }

    // Se uma nova imagem foi enviada, deletar a antiga
    if (req.file) {
      const oldProduct = await prisma.product.findUnique({
        where: { id: parseInt(id) }
      });

      if (oldProduct?.imageUrl) {
        deleteOldImage(oldProduct.imageUrl);
      }
    }

    // Gera URL da nova imagem se foi enviada
    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    // Remove todas as categorias existentes
    await prisma.productCategory.deleteMany({
      where: { productId: parseInt(id) }
    });

    // Atualiza o produto
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(imageUrl && { imageUrl }),
      ...(active !== undefined && { active: active === "true" || active === true }),
      categories: parsedCategoryIds && parsedCategoryIds.length > 0 ? {
        create: parsedCategoryIds.map(catId => ({
          categoryId: parseInt(catId)
        }))
      } : undefined,
    };

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar produto (apenas admin)
router.put("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, categoryIds, active } = req.body;
  try {
    // Primeiro, remove todas as categorias existentes
    await prisma.productCategory.deleteMany({
      where: { productId: parseInt(id) }
    });

    // Depois atualiza o produto e adiciona novas categorias
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl,
        active,
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map(catId => ({
            categoryId: parseInt(catId)
          }))
        } : undefined,
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar produto (apenas admin)
router.delete("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ativar/desativar produto (toggle) (apenas admin)
router.post("/:id/toggle", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { active: !product.active },
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// ROTAS DE GESTÃO DE MÚLTIPLAS IMAGENS
// ============================================================

// Adicionar imagem a um produto (apenas admin)
// POST /products/:id/images
router.post("/:id/images", adminAuth, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { order } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    // Verifica se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Define a ordem (se não foi especificada, usa o próximo número)
    const imageOrder = order !== undefined
      ? parseInt(order)
      : product.images.length;

    // Cria a imagem
    const imageUrl = `/uploads/products/${req.file.filename}`;

    const productImage = await prisma.productImage.create({
      data: {
        productId: parseInt(id),
        imageUrl,
        order: imageOrder
      }
    });

    res.status(201).json(productImage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar imagens de um produto (público)
// GET /products/:id/images
router.get("/:id/images", async (req, res) => {
  const { id } = req.params;

  try {
    const images = await prisma.productImage.findMany({
      where: { productId: parseInt(id) },
      orderBy: { order: 'asc' }
    });

    res.json(images);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar uma imagem específica de um produto (apenas admin)
// DELETE /products/:id/images/:imageId
router.delete("/:id/images/:imageId", adminAuth, async (req, res) => {
  const { id, imageId } = req.params;

  try {
    // Busca a imagem
    const image = await prisma.productImage.findFirst({
      where: {
        id: parseInt(imageId),
        productId: parseInt(id)
      }
    });

    if (!image) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }

    // Deleta a imagem do disco
    deleteOldImage(image.imageUrl);

    // Deleta do banco
    await prisma.productImage.delete({
      where: { id: parseInt(imageId) }
    });

    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar ordem das imagens (apenas admin)
// PUT /products/:id/images/reorder
// Body: { images: [{ id: 1, order: 0 }, { id: 2, order: 1 }] }
router.put("/:id/images/reorder", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { images } = req.body;

  try {
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ error: "Campo 'images' deve ser um array" });
    }

    // Atualiza a ordem de cada imagem
    const updatePromises = images.map(img =>
      prisma.productImage.update({
        where: {
          id: parseInt(img.id)
        },
        data: {
          order: parseInt(img.order)
        }
      })
    );

    await Promise.all(updatePromises);

    // Retorna as imagens atualizadas
    const updatedImages = await prisma.productImage.findMany({
      where: { productId: parseInt(id) },
      orderBy: { order: 'asc' }
    });

    res.json(updatedImages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload de múltiplas imagens de uma vez (apenas admin)
// POST /products/:id/images/multiple
router.post("/:id/images/multiple", adminAuth, upload.array("images", 10), async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    // Verifica se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Cria todas as imagens
    let currentOrder = product.images.length;

    const createPromises = req.files.map((file, index) => {
      const imageUrl = `/uploads/products/${file.filename}`;
      return prisma.productImage.create({
        data: {
          productId: parseInt(id),
          imageUrl,
          order: currentOrder + index
        }
      });
    });

    const createdImages = await Promise.all(createPromises);

    res.status(201).json({
      message: `${createdImages.length} imagens adicionadas com sucesso`,
      images: createdImages
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
