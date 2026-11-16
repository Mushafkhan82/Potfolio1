import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function appUrlMetaPlugin(): Plugin {
  return {
    name: 'app-url-meta-plugin',
    transformIndexHtml(html) {
      const appUrl = (process.env.APP_URL || 'https://mushafkhan.com')
        .trim()
        .replace(/\/+$/, '');
      return html.replace(/https:\/\/mushafkhan\.com/g, appUrl);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), appUrlMetaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return undefined;
          },
        },
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
