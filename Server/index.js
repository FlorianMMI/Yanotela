import app from './src/app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Serveur Yanotela démarré sur le port ${PORT}`);
    console.log(`📧 Système d'authentification avec validation email activé`);
});