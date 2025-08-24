// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

import path from 'path';
import fs from 'fs';

function getEntries() {
  const entries: Record<string, string> = {
    index: 'index.html',
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
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets:[
        "dropped-scrolls.jpg", 
        "kofi_symbol-edited.png",
        "manifest.json",
        "scrollcaster-icon.ico",
        "scrollcaster-icon.png",
        "support_me_on_kofi_beige.webp",
        "flaticon/001-sword.png",
        "flaticon/002-flag.png",
        "flaticon/003-circle.png",
        "flaticon/004-cursor.png",
        "flaticon/005-star.png",
        "flaticon/006-archery.png",
        "flaticon/007-shield.png",
        "flaticon/008-skull.png",
        "flaticon/009-right-arrow.png",
        "flaticon/010-loupe.png",
        "flaticon/011-open-book.png",
        "flaticon/012-left-arrow.png",
        "flaticon/013-gear.png",
        "flaticon/014-plus-symbol-button.png",
        "flaticon/015-minus.png",
        "flaticon/016-danger.png",
        "flaticon/017-check.png",
        "flaticon/018-dots.png",
        "flaticon/019-comment-info.png"
      ],
      manifest: {
        name: 'Scrollcaster',
        short_name: 'Scrollcaster',
        start_url: '/index.html?inset-bottom=64',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            "src": "scrollcaster-icon.ico",
            "sizes": "256x256",
            "type": "image/icon"
          },
          {
            "src": "scrollcaster-icon.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ]
      }
    })
  ],
  publicDir: 'resources',  //Declare the public folder relative to root
  assetsInclude: ['**/*.png', '**/*.ico', '**/*.webp'],
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
      '@ico': path.resolve(__dirname, 'resources/flaticon'),
      '@scrollcaster/shared-lib': path.resolve(__dirname, '../packages/shared-lib/src'),
    }
  }
});
