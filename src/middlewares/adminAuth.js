const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Middleware de autenticação administrativa
 * Suporta autenticação via Basic Auth no header Authorization
 */
function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;

    // Validar se o header Authorization existe
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: "Autenticação necessária. Header Authorization ausente."
      });
    }

    // Suporte para Basic Auth
    if (auth.startsWith("Basic ")) {
      const b64 = auth.split(" ")[1];

      if (!b64) {
        return res.status(401).json({
          success: false,
          error: "Formato de autenticação inválido"
        });
      }

      const decoded = Buffer.from(b64, "base64").toString("utf8");
      const [user, pass] = decoded.split(":");

      // Validar credenciais
      if (!ADMIN_USER || !ADMIN_PASSWORD) {
        console.error("ERRO: Variáveis ADMIN_USER ou ADMIN_PASSWORD não configuradas");
        return res.status(500).json({
          success: false,
          error: "Configuração do servidor incompleta"
        });
      }

      if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
        return next();
      }
    }

    // Autenticação falhou
    return res.status(401).json({
      success: false,
      error: "Credenciais inválidas"
    });
  } catch (error) {
    console.error("Erro no middleware adminAuth:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno no processo de autenticação"
    });
  }
}

module.exports = adminAuth;
