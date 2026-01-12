const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");
const { upload, deleteOldImage } = require("../middleware/upload");

// ============================================================
// ROTAS DE UPLOAD DE IMAGEM (devem vir ANTES das outras rotas)
// ============================================================

// Upload de imagem para categoria (apenas admin)
// POST /categories/upload-image
router.post("/upload-image", adminAuth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    // Retorna a URL da imagem que foi salva
    const imageUrl = `/uploads/categories/${req.file.filename}`;

    res.status(201).json({
      message: "Imagem enviada com sucesso",
      imageUrl
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Criar categoria COM upload de imagem (apenas admin)
// POST /categories/with-image
router.post("/with-image", adminAuth, upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;

    // Gera URL da imagem se foi enviada
    const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : null;

    const category = await prisma.category.create({
      data: { name, imageUrl },
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar categoria COM upload de imagem (apenas admin)
// PUT /categories/:id/with-image
router.put("/:id/with-image", adminAuth, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  try {
    const { name } = req.body;

    // Se uma nova imagem foi enviada, deletar a antiga
    if (req.file) {
      const oldCategory = await prisma.category.findUnique({
        where: { id: parseInt(id) }
      });

      if (oldCategory?.imageUrl) {
        deleteOldImage(oldCategory.imageUrl);
      }
    }

    // Gera URL da nova imagem se foi enviada
    const imageUrl = req.file ? `/uploads/categories/${req.file.filename}` : undefined;

    const updateData = {
      ...(name && { name }),
      ...(imageUrl && { imageUrl }),
    };

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================
// ROTAS NORMAIS (JSON)
// ============================================================

router.post("/", adminAuth, async (req, res) => {
  const { name, imageUrl } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, imageUrl },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  const { page = 1, limit = 10, paginated = "true" } = req.query;

  try {
    if (paginated === "false") {
      const categories = await prisma.category.findMany({
        include: { products: true },
        orderBy: { id: "desc" },
      });
      return res.json(categories);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const categories = await prisma.category.findMany({
      include: { products: true },
      skip,
      take: limitNum,
      orderBy: { id: "desc" },
    });

    const total = await prisma.category.count();

    res.json({
      data: categories,
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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { products: true },
    });
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  const { name, imageUrl } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name, imageUrl },
    });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
