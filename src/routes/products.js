const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");

// Criar produto (apenas admin)
router.post("/", adminAuth, async (req, res) => {
  const { name, description, price, imageUrl, categoryId, active } = req.body;
  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        categoryId: categoryId ? parseInt(categoryId) : null,
        active: active !== undefined ? !!active : true,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar produtos (público, com filtros opcionais e paginação)
router.get("/", async (req, res) => {
  const { category, active, page = 1, limit = 10, paginated = "true" } = req.query;
  const where = {};

  if (category) where.categoryId = parseInt(category);
  if (active !== undefined) where.active = active === "true";

  try {
    // Se paginated=false, retorna todos os produtos sem paginação (backward compatibility)
    if (paginated === "false") {
      const products = await prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { id: "desc" },
      });
      return res.json(products);
    }

    // Converte page e limit para números e valida
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 itens por página
    const skip = (pageNum - 1) * limitNum;

    // Busca os produtos paginados
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      skip,
      take: limitNum,
      orderBy: { id: "desc" }, // Ordenação padrão por ID decrescente
    });

    // Conta o total de produtos para calcular total de páginas
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
    res.status(400).json({ error: error.message });
  }
});

// Buscar produto por ID (público)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { category: true },
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

// Atualizar produto (apenas admin)
router.put("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl, categoryId, active } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl,
        categoryId: categoryId ? parseInt(categoryId) : null,
        active,
      },
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

module.exports = router;
