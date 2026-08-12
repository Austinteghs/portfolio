import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// Automatically find all html files in projects/ for the build
function getProjectPages() {
  const pages = {};
  if (fs.existsSync('projects')) {
    const files = fs.readdirSync('projects');
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const name = file.replace('.html', '');
        pages[`project_${name}`] = resolve(__dirname, `projects/${file}`);
      }
    });
  }
  return pages;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...getProjectPages()
      }
    }
  }
});
