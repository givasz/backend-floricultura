const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

function createServer() {
  const app = express();

  // Configurar CORS para produção e desenvolvimento
  const allowedOrigins = [
    'https://flordemaiobygiovanna.netlify.app', // Frontend Netlify (produção)
    'http://217.196.60.25',      // Frontend em produção (IP)
    'http://localhost:5173',      // Desenvolvimento local
    'http://localhost:3000',      // Desenvolvimento local alternativo
  ];

  app.use(cors({
    origin: function(origin, callback) {
      // Permite requisições sem origin (mobile apps, Postman, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  }));

  // Middleware global para parsing de JSON e URL-encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // Rotas de saúde
  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  return app;
}

module.exports = createServer;
