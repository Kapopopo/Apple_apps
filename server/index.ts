/** Lancement : npm start (ou npm start -- --port 8080). Écoute uniquement sur 127.0.0.1. */
import { createAtlasServer, webReady } from './app.js';

const args = process.argv.slice(2);
const flag = args.indexOf('--port');
const port = Number(flag >= 0 ? args[flag + 1] : (process.env.PORT ?? 8000));
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Port invalide : ${args[flag + 1]}`);
  process.exit(2);
}
const missing = webReady();
if (missing.length) {
  console.error(`Fichiers web manquants : ${missing.join(', ')}`);
  process.exit(1);
}
createAtlasServer().listen(port, '127.0.0.1', () => {
  console.log(`Component Atlas → http://localhost:${port}  ·  Builder → http://localhost:${port}/builder`);
});
