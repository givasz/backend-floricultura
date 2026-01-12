const express = require("express");
const router = express.Router();

// Credenciais vêm EXCLUSIVAMENTE do backend
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_ROUTE = process.env.ADMIN_ROUTE;

/**
 * POST /api/admin/login
 * Rota pública de login para o painel administrativo
 * O front-end envia email e password, o backend valida contra variáveis de ambiente
 */
router.post("/login", async (req, res) => {
  try {
    // Validação de req.body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        error: "Requisição inválida"
      });
    }

    const { email, password } = req.body;

    // Validação de campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios"
      });
    }

    // Validação contra variáveis de ambiente
    if (!ADMIN_USER || !ADMIN_PASSWORD || !ADMIN_ROUTE) {
      console.error("ERRO CRÍTICO: Variáveis de ambiente ADMIN_USER, ADMIN_PASSWORD ou ADMIN_ROUTE não configuradas");
      return res.status(500).json({
        success: false,
        error: "Configuração do servidor incompleta"
      });
    }

    // Verificar credenciais (comparação case-sensitive)
    if (email === ADMIN_USER && password === ADMIN_PASSWORD) {
      // Retornar a rota secreta APENAS após autenticação bem-sucedida
      return res.status(200).json({
        success: true,
        message: "Login realizado com sucesso",
        adminRoute: ADMIN_ROUTE,
        user: {
          email: ADMIN_USER
        }
      });
    } else {
      // Credenciais inválidas
      return res.status(401).json({
        success: false,
        error: "Email ou senha incorretos"
      });
    }
  } catch (error) {
    console.error("Erro no login admin:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/admin/verify
 * Verifica se o usuário ainda está autenticado (opcional)
 */
router.get("/verify", (req, res) => {
  // Aqui você pode implementar verificação de sessão/token se necessário
  res.json({
    success: true,
    message: "Rota de verificação"
  });
});

module.exports = router;
