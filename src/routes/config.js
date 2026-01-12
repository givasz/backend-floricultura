const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");

// GET /config - Retorna as configurações (público)
router.get("/", async (req, res) => {
  try {
    let config = await prisma.config.findFirst();

    // Se não existir configuração, criar uma padrão
    if (!config) {
      config = await prisma.config.create({
        data: {
          heroImageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop',
        },
      });
    }

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /config - Atualiza as configurações (requer autenticação)
router.put("/", adminAuth, async (req, res) => {
  const { heroImageUrl } = req.body;

  try {
    // Buscar a primeira (e única) configuração
    let config = await prisma.config.findFirst();

    if (!config) {
      // Se não existir, criar
      config = await prisma.config.create({
        data: { heroImageUrl },
      });
    } else {
      // Se existir, atualizar
      config = await prisma.config.update({
        where: { id: config.id },
        data: { heroImageUrl },
      });
    }

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
