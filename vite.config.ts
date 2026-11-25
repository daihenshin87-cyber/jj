import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Serves and copies /assets, /content, and /world.json for both Vite and static serve compatibility.
      {
        name: 'serve-and-copy-game-data',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = (req.url || '').split('?')[0];
            if (urlPath === '/world.json' || urlPath.startsWith('/content/') || urlPath.startsWith('/assets/')) {
              const rel = urlPath.replace(/^\/+/, '');
              const abs = path.resolve(__dirname, rel);
              if (abs.startsWith(__dirname) && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
                const ext = path.extname(abs).toLowerCase();
                const mime = ext === '.json' ? 'application/json' : ext === '.glb' ? 'model/gltf-binary' : ext === '.gltf' ? 'model/gltf+json' : 'application/octet-stream';
                res.setHeader('Content-Type', mime);
                fs.createReadStream(abs).pipe(res);
                return;
              }
            }
            next();
          });
        },
        closeBundle(error?: Error): void {
          if (error) return;
          const distDir = path.resolve(__dirname, 'dist');
          for (const dirName of ['src/assets', 'assets', 'content']) {
            const srcPath = path.resolve(__dirname, dirName);
            const destPath = path.resolve(distDir, dirName);
            if (fs.existsSync(distDir) && fs.existsSync(srcPath)) {
              fs.cpSync(srcPath, destPath, {recursive: true, force: true});
            }
          }
          const worldJson = path.resolve(__dirname, 'world.json');
          if (fs.existsSync(distDir) && fs.existsSync(worldJson)) {
            fs.copyFileSync(worldJson, path.resolve(distDir, 'world.json'));
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
