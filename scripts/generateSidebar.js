import fs from 'fs';
import path from 'path';

const docsDir = path.join(process.cwd(), 'public/documentation');

function scanDir(dir) {
  const items = [];
  for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (dirent.isDirectory()) {
      items.push({
        type: 'folder',
        name: dirent.name,
        children: scanDir(path.join(dir, dirent.name)),
      });
    } else if (dirent.name.endsWith('.md')) {
      items.push({
        type: 'file',
        name: dirent.name.replace('.md', ''),
        file: dirent.name,
      });
    }
  }
  return items;
}

for (const dirent of fs.readdirSync(docsDir, { withFileTypes: true })) {
  if (dirent.isDirectory()) {
    const sidebar = scanDir(path.join(docsDir, dirent.name));
    fs.writeFileSync(
      path.join(docsDir, dirent.name, 'sidebar.json'),
      JSON.stringify(sidebar, null, 2)
    );
    console.log(`sidebar.json generated for ${dirent.name}`);
  }
}