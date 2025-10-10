import 'dotenv/config';
import { httpServer } from './src/app.js';

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Serveur Yanotela démarré sur le port ${PORT}`);
    console.log(`📧 Système d'authentification avec validation email activé`);
    console.log(`🔌 Socket.IO activé pour la collaboration temps réel`);
    console.log(`🌍 Endpoint WebSocket: ws://localhost:${PORT}`);
});