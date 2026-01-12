require("dotenv").config();
const createServer = require("./server");
const prisma = require("./prismaClient");
const path = require("path");

// Importar routers
const usersRouter = require("./routes/users");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const cartsRouter = require("./routes/carts");
const configRouter = require("./routes/config");
const adminAuth = require("./middlewares/adminAuth");

const PORT = process.env.PORT || 3000;

// Criar aplicação Express
const app = createServer();

// Servir arquivos estáticos da pasta uploads
app.use("/uploads", require("express").static(path.join(__dirname, "../uploads")));

// Registrar rotas
app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/config", configRouter);

// Rota administrativa de carrinhos (DEVE vir ANTES da rota /carrinho/:uid)
app.get("/admin/carrinhos", adminAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    // Converte page e limit para números e valida
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Busca os carrinhos paginados
    const carts = await prisma.cart.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Conta o total de carrinhos
    const total = await prisma.cart.count();

    res.json({
      data: carts,
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

// Rotas de carrinho (públicas e protegidas)
app.use("/carrinho", cartsRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});
