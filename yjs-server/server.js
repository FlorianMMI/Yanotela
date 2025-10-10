#!/usr/bin/env node

const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');
const fs = require('fs');
const path = require('path');

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 1234;
const persistenceDir = process.env.YPERSISTENCE || '/data/yjs-persistence';

// Créer le dossier de persistence s'il n'existe pas
if (!fs.existsSync(persistenceDir)) {
  fs.mkdirSync(persistenceDir, { recursive: true });
  console.log(`Created persistence directory: ${persistenceDir}`);
}

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server is running\n');
});

const wss = new WebSocket.Server({ server });

// Tracker pour éviter les logs spam
const connections = new Map();

wss.on('connection', (ws, req) => {
  const clientId = req.socket.remoteAddress;
  const url = req.url || '/';
  const docName = url.slice(1).split('?')[0] || 'default';
  
  // Logger uniquement les nouvelles connexions uniques
  if (!connections.has(clientId)) {
    console.log(`[${new Date().toISOString()}] New client connected: ${clientId} (doc: ${docName})`);
  }
  
  connections.set(clientId, (connections.get(clientId) || 0) + 1);
  
  // Configuration robuste pour setupWSConnection
  setupWSConnection(ws, req, { 
    gc: true,
    gcFilter: () => true,
    docName: docName,
    // Paramètres de performance
    resyncInterval: 120000, // 2 minutes au lieu de défaut
    maxUpdateSize: 100000, // 100KB max par update
    // Gérer les erreurs de façon gracieuse
    onClose: (doc, conn) => {
      console.log(`[${new Date().toISOString()}] Document connection closed: ${docName}`);
    },
    onDisconnect: (doc, conn) => {
      console.log(`[${new Date().toISOString()}] Document disconnected: ${docName}`);
    }
  });

  // Gérer les pings pour maintenir la connexion
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // Ping toutes les 30 secondes

  ws.on('pong', () => {
    // Client répond, connexion stable
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    const count = connections.get(clientId) - 1;
    if (count <= 0) {
      connections.delete(clientId);
      console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId} (code: ${code}, reason: ${reason})`);
    } else {
      connections.set(clientId, count);
    }
  });

  ws.on('error', (error) => {
    clearInterval(pingInterval);
    console.error(`[${new Date().toISOString()}] WebSocket error from ${clientId}:`, error.message);
  });
});

server.listen(port, host, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║  Yanotela Yjs WebSocket Server                    ║
║  Running on ${host}:${port.toString().padEnd(26)}║
║  Persistence: ${persistenceDir.padEnd(30)}║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] Shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('[SIGTERM] Server closed successfully');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\n[SIGINT] Shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      console.log('[SIGINT] Server closed successfully');
      process.exit(0);
    });
  });
});

// Log des stats toutes les 5 minutes
setInterval(() => {
  console.log(`[STATS] Active connections: ${wss.clients.size} | Unique clients: ${connections.size}`);
}, 300000);