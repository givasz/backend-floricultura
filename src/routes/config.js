const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const adminAuth = require("../middlewares/adminAuth");
const { upload, deleteOldImage } = require("../middleware/upload");

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

// POST /config/upload-image - Upload da imagem hero (admin)
router.post("/upload-image", adminAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
    }

    const imageUrl = `/uploads/hero/${req.file.filename}`;

    // Atualiza ou cria config com a nova heroImageUrl
    let config = await prisma.config.findFirst();

    if (!config) {
      config = await prisma.config.create({ data: { heroImageUrl: imageUrl } });
    } else {
      // Deletar imagem antiga caso seja local
      deleteOldImage(config.heroImageUrl);
      config = await prisma.config.update({
        where: { id: config.id },
        data: { heroImageUrl: imageUrl },
      });
    }

    res.status(201).json({ message: "Imagem enviada com sucesso", imageUrl, config });
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
