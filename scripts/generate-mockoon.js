const { execSync } = require('child_process');
const fs = require('fs-extra');

try {
  execSync(
    'npx mockoon-cli import --input swagger-linked.json --output mocks/mockoon.json --prettify',
    { stdio: 'inherit' }
  );
  console.log('✅ Generated mocks/mockoon.json');
} catch (err) {
  console.error('❌ Mockoon import failed', err);
  process.exit(1);
}

// remove the temporary linked spec
fs.unlinkSync('swagger-linked.json');
console.log('🧹 Removed swagger-linked.json');