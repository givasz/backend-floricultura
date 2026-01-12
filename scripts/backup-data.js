const fs = require('fs');
const path = require('path');

// Importar PrismaClient dinamicamente após garantir que foi gerado
let prisma;

function initPrisma() {
  if (!prisma) {
    // Limpar cache para forçar reimportação
    delete require.cache[require.resolve('@prisma/client')];
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

async function backupData() {
  try {
    console.log('🔄 Iniciando backup dos dados...');

    const db = initPrisma();

    const backup = {
      timestamp: new Date().toISOString(),
      users: await db.user.findMany(),
      categories: await db.category.findMany(),
      products: await db.$queryRaw`
        SELECT id, name, description, price, "imageUrl", active, "categoryId", "createdAt", "updatedAt"
        FROM "Product"
      `,
      carts: await db.cart.findMany({
        include: {
          items: true
        }
      })
    };

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log('✅ Backup criado com sucesso!');
    console.log(`📁 Arquivo: ${filepath}`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Usuários: ${backup.users.length}`);
    console.log(`   - Categorias: ${backup.categories.length}`);
    console.log(`   - Produtos: ${backup.products.length}`);
    console.log(`   - Carrinhos: ${backup.carts.length}`);

    return filepath;
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  backupData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { backupData };
