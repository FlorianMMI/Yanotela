import 'dotenv/config';
import { httpServer } from './src/app.js';

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO prêt pour collaboration temps réel`);
  console.log(`🔥 Yjs CRDT activé\n`);
});