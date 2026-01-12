require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Configurar adapter para Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Criar ou atualizar configuração padrão
  const existingConfig = await prisma.config.findFirst();

  if (!existingConfig) {
    console.log('Creating default config...');
    await prisma.config.create({
      data: {
        heroImageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop',
      },
    });
    console.log('Default config created!');
  } else {
    console.log('Config already exists, skipping seed.');
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
