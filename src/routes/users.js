const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// Criar novo usuário
router.post("/", async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Listar todos os usuários (com paginação)
router.get("/", async (req, res) => {
  const { page = 1, limit = 10, paginated = "true" } = req.query;

  try {
    // Se paginated=false, retorna todos os usuários sem paginação (backward compatibility)
    if (paginated === "false") {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true },
        orderBy: { id: "desc" },
      });
      return res.json(users);
    }

    // Converte page e limit para números e valida
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 itens por página
    const skip = (pageNum - 1) * limitNum;

    // Busca os usuários paginados
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      skip,
      take: limitNum,
      orderBy: { id: "desc" },
    });

    // Conta o total de usuários
    const total = await prisma.user.count();

    res.json({
      data: users,
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

// Buscar usuário por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar usuário
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deletar usuário
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
