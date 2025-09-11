import fs from 'fs';
import path from 'path';

const docsDir = path.join(process.cwd(), 'public/documentation');
const products = [];

for (const dirent of fs.readdirSync(docsDir, { withFileTypes: true })) {
  if (dirent.isDirectory()) {
    const productPath = path.join(docsDir, dirent.name);
    let description = '';
    const overviewPath = path.join(productPath, 'overview.md');
    if (fs.existsSync(overviewPath)) {
      description = fs.readFileSync(overviewPath, 'utf8').split('\n')[0];
    }
    products.push({
      id: dirent.name,
      name: dirent.name,
      description,
    });
  }
}

fs.writeFileSync(
  path.join(docsDir, 'products.json'),
  JSON.stringify(products, null, 2)
);

console.log('products.json generated!');