const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");

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
