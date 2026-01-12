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

async function restoreData(backupFilePath) {
  try {
    console.log('🔄 Iniciando restauração dos dados...');

    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Arquivo de backup não encontrado: ${backupFilePath}`);
    }

    const db = initPrisma();
    const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    console.log(`📅 Backup criado em: ${backup.timestamp}`);

    // Restaurar usuários
    console.log('\n👥 Restaurando usuários...');
    for (const user of backup.users) {
      await db.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`   ✓ ${backup.users.length} usuários restaurados`);

    // Restaurar categorias
    console.log('\n📂 Restaurando categorias...');
    for (const category of backup.categories) {
      await db.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      });
    }
    console.log(`   ✓ ${backup.categories.length} categorias restauradas`);

    // Restaurar produtos COM múltiplas categorias
    console.log('\n🌸 Restaurando produtos...');
    for (const product of backup.products) {
      const { categoryId, ...productData } = product;

      // Criar produto sem categoria
      const createdProduct = await db.product.upsert({
        where: { id: product.id },
        update: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          active: productData.active,
        },
        create: {
          id: product.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          imageUrl: productData.imageUrl,
          active: productData.active,
          createdAt: productData.createdAt,
          updatedAt: productData.updatedAt,
        }
      });

      // Se tinha categoria, criar relação na tabela intermediária
      if (categoryId !== null && categoryId !== undefined) {
        await db.productCategory.upsert({
          where: {
            productId_categoryId: {
              productId: createdProduct.id,
              categoryId: categoryId
            }
          },
          update: {},
          create: {
            productId: createdProduct.id,
            categoryId: categoryId
          }
        });
      }
    }
    console.log(`   ✓ ${backup.products.length} produtos restaurados`);

    // Restaurar carrinhos
    console.log('\n🛒 Restaurando carrinhos...');
    for (const cart of backup.carts) {
      const { items, ...cartData } = cart;

      await db.cart.upsert({
        where: { id: cart.id },
        update: cartData,
        create: cartData
      });

      // Restaurar itens do carrinho
      for (const item of items) {
        await db.cartItem.upsert({
          where: { id: item.id },
          update: item,
          create: item
        });
      }
    }
    console.log(`   ✓ ${backup.carts.length} carrinhos restaurados`);

    console.log('\n✅ Restauração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao restaurar dados:', error);
    throw error;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Uso: node scripts/restore-data.js <caminho-do-backup>
if (require.main === module) {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('❌ Por favor, forneça o caminho do arquivo de backup');
    console.log('Uso: node scripts/restore-data.js <caminho-do-backup>');
    process.exit(1);
  }

  restoreData(backupPath)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { restoreData };
