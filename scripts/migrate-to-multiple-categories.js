const { execSync } = require('child_process');
const path = require('path');

async function migrate() {
  console.log('🚀 Iniciando migração para múltiplas categorias...\n');

  try {
    // Passo 1: Gerar Prisma Client atual
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 1: Gerar Prisma Client');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Passo 2: Backup
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 2: Backup dos dados');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { backupData } = require('./backup-data');
    const backupPath = await backupData();

    // Passo 3: Reset do banco
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 3: Reset do banco de dados');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠️  Isso vai limpar todos os dados do banco!\n');

    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Passo 4: Aplicar nova migration
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 4: Aplicar nova migration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    execSync('npx prisma migrate dev --name add-multiple-categories', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Passo 5: Gerar novo Prisma Client
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 5: Gerar novo Prisma Client');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Passo 6: Restaurar dados
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PASSO 6: Restaurar dados');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Limpar cache do require para pegar o novo PrismaClient
    delete require.cache[require.resolve('./restore-data')];
    const { restoreData } = require('./restore-data');
    await restoreData(backupPath);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📁 Backup salvo em: ${backupPath}`);
    console.log('🎉 Seu banco de dados está atualizado!\n');

  } catch (error) {
    console.error('\n❌ ERRO durante a migração:', error.message);
    console.error('\n⚠️  Se algo deu errado, você pode restaurar o backup manualmente:');
    console.error('   1. Rode: npx prisma generate');
    console.error('   2. Rode: node scripts/restore-data.js <caminho-do-backup>\n');
    process.exit(1);
  }
}

migrate();
