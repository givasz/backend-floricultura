const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

function createServer() {
  const app = express();

  // Habilitar CORS para todas as origens (desenvolvimento)
  app.use(cors());

  // Middleware global
  app.use(bodyParser.json());

  // Rotas de saúde
  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  return app;
}

module.exports = createServer;
