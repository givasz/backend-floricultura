const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Garante que os diretórios existem
const uploadsDir = path.join(__dirname, '../../uploads');
const productsDir = path.join(uploadsDir, 'products');
const categoriesDir = path.join(uploadsDir, 'categories');
const heroDir = path.join(uploadsDir, 'hero');

[uploadsDir, productsDir, categoriesDir, heroDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Define o destino baseado na rota
    let uploadPath = productsDir;

    if (req.baseUrl && req.baseUrl.includes('categories')) {
      uploadPath = categoriesDir;
    } else if (req.baseUrl && req.baseUrl.includes('config')) {
      uploadPath = heroDir;
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gera nome único: timestamp + nome original sanitizado
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-') // Remove caracteres especiais
      .toLowerCase()
      .substring(0, 50); // Limita tamanho

    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// Filtro de arquivos - apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Middleware de upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Função para deletar arquivo antigo (quando atualizar imagem)
const deleteOldImage = (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith('http')) {
    return; // URL externa, não precisa deletar
  }

  try {
    // Extrai o caminho relativo da URL (ex: /uploads/products/imagem.jpg)
    const relativePath = imageUrl.replace(/^\//, ''); // Remove / inicial
    const fullPath = path.join(__dirname, '../../', relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('Imagem antiga deletada:', fullPath);
    }
  } catch (error) {
    console.error('Erro ao deletar imagem antiga:', error);
  }
};

module.exports = {
  upload,
  deleteOldImage
};
