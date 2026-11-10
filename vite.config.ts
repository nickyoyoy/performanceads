import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'google-sheets-proxy',
      configureServer(server) {
        server.middlewares.use('/api/sheets-csv', async (_req, res) => {
          try {
            // Append cache-buster timestamp to ensure Google Sheets always serves fresh data
            const freshUrl = `https://docs.google.com/spreadsheets/d/1PXarMDXbHSFtvAy1Luv1ch_A-vEZ0XngCHJ4cO0rzWk/export?format=csv&gid=0&_t=${Date.now()}`;
            const fetchRes = await fetch(freshUrl, {
              redirect: 'follow',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
              },
            });
            if (!fetchRes.ok) {
              res.statusCode = fetchRes.status;
              res.end(`Google Sheets fetch failed with status ${fetchRes.status}`);
              return;
            }
            const csv = await fetchRes.text();
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.end(csv);
          } catch (err: unknown) {
            res.statusCode = 502;
            const message = err instanceof Error ? err.message : 'Failed to fetch spreadsheet';
            res.end(`Proxy error: ${message}`);
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
});
