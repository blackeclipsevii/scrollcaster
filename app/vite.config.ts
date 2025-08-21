// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

function getEntries() {
  const entries: Record<string, string> = {
    index: 'index.html',
    'service-worker': 'service-worker.js',
    'version': 'version.ts'
  };

  // Example: include all .ts files in src/pages or modules
  const folders = ['lib', 'pages', 'resources'];
  folders.forEach(folder => {
    fs.readdirSync(folder).forEach(file => {
      ['.ts', '.js', '.css', '.html', '.png', '.ico', '.webp', '.json'].every(ext => {
        if (file.endsWith(ext)) {
          console.log(file)
          const name = file.replace(ext, '');
          entries[name] = path.resolve(__dirname, folder, file);
          return false;
        }
        return true;
      })
    });
  });

  return entries;
}

export default defineConfig({
  plugins: [vue()],
  publicDir: 'public',  //Declare the public folder relative to root
  assetsInclude: ['resources/**/*.png', 'resources/**/*.ico', 'resources/**/*.webp'],
  build: {
    minify: false,

    outDir: 'output',
    rollupOptions: {
      input: getEntries(),
      output: {
        manualChunks(id) {
          if (id.includes('lib/')) {
            return 'lib'; // All utils go into utils.js
          }
          if (id.includes('pages/')) {
            return 'pages'; // All utils go into utils.js
          }
          
          return 'blob';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@res': path.resolve(__dirname, 'resources'),
      '@ico': path.resolve(__dirname, 'resources/flaticon')
    }
  }
});
