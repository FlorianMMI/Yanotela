/**
 * Script de test de la connexion au serveur YJS
 * Utile pour déboguer les problèmes de notifications
 */

import { sendNotificationToUser } from './yjsBroadcastClient.js';

/**
 * Teste la connexion au serveur YJS en envoyant une notification test
 * @param {number} userId - ID de l'utilisateur test
 */
export async function testYjsConnection(userId = 1) {
  console.log(`🧪 [Test YJS] Test de connexion pour userId=${userId}`);
  
  const testNotification = {
    id: `test-${Date.now()}`,
    type: 'TEST',
    message: 'Test de connexion YJS',
    timestamp: Date.now(),
    targetUserId: userId,
  };

  try {
    const success = await sendNotificationToUser(userId, testNotification);
    
    if (success) {
      console.log(`✅ [Test YJS] Connexion réussie !`);
    } else {
      console.error(`❌ [Test YJS] Échec de l'envoi`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ [Test YJS] Erreur:`, error.message);
    return false;
  }
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const userId = parseInt(process.argv[2]) || 1;
  testYjsConnection(userId).then(success => {
    process.exit(success ? 0 : 1);
  });
}
