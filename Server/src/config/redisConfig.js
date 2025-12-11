import { createClient } from 'redis';

const client = createClient({
  socket: { 
    host: process.env.REDIS_HOST || 'redis-dev', 
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD || 'gy6tHV2P3wssG97Y8'
});

client.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

client.on('connect', () => {
  console.log('✅ Redis connecté !');
});

// Connexion au démarrage
await client.connect().catch(err => {
  console.error('❌ Impossible de se connecter à Redis:', err.message);
});

export default client;