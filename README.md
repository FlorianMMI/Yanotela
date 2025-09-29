## 🚀 Initialisation du projet

Pour démarrer le projet, exécutez:

Pour démarrer le projet en local:
##  Coté client:
    ```
    npm i
    npm run dev
    ```
##  Coté server:
    ```
    npm i
    npx prisma generate
    node server.js
    ```


```bash
./setup.sh
```

## 🏷️ Convention de nommage GitFlow

- **Branche principale** : `develop`
- **Branche de fonctionnalité** :  
    `feature/[nom_de_l'US]`  
    _Exemple&nbsp;:_  
    `feature/US1.1-creation-de-compte`
- **Message de commit** :  
    `[US] - [Description du contenu]`  
    _Exemple&nbsp;:_  
    `[US1.1] - Création de la page d'inscription`


