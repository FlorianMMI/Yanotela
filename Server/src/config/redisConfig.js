import { createClient } from 'redis';

const client = createClient({
  socket: { 
    host: process.env.REDIS_HOST || 'redis-dev', 
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  password: process.env.REDIS_PASSWORD || 'gy6tHV2P3wssG97Y8'
});

client.on('error', (err) => {
  
});

client.on('connect', () => {
  
});

// Connexion au démarrage
await client.connect().catch(err => {
  
});

export default client;