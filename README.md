# VocabMaster 📚

VocabMaster est une application mobile moderne conçue pour aider les utilisateurs à enrichir leur vocabulaire de manière structurée et interactive. Développée avec **React Native** et **Expo**, elle offre une expérience fluide pour mémoriser de nouveaux mots grâce à un système de quiz intelligent et une gestion de base de données locale.

## ✨ Fonctionnalités

- **📇 Gestion du Vocabulaire** : Visualisez tous vos mots enregistrés dans une interface élégante.
- **➕ Ajout de Mots** : Formulaire intuitif pour ajouter de nouveaux termes avec leurs définitions et exemples.
- **🧠 Quiz Interactif** : Testez vos connaissances avec un mode quiz qui suit vos progrès.
- **💾 Persistance Locale** : Utilisation de **SQLite** (`expo-sqlite`) pour conserver vos données directement sur votre appareil.
- **📱 Design Premium** : Une interface utilisateur soignée avec un mode sombre subtil, des animations douces et une navigation ergonomique.

## 🛠️ Stack Technique

- **Framework** : [React Native](https://reactnative.dev/) (Expo SDK 54)
- **Navigation** : [React Navigation](https://reactnavigation.org/) (Bottom Tabs)
- **Base de données** : SQLite (via `expo-sqlite`)
- **Icônes** : MaterialIcons (Expo Vector Icons)
- **Langage** : JavaScript (ES6+)

## 🚀 Installation et Lancement

### Prérequis

1.  **Node.js** (LTS recommandé)
2.  **npm** ou **yarn**
3.  **Expo Go** installé sur votre smartphone (disponible sur iOS et Android) ou un émulateur configuré.

### Étapes

1.  **Cloner le projet** (ou naviguer dans le dossier) :
    ```bash
    cd VocabMaster
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

3.  **Lancer le projet** :
    ```bash
    npm start
    ```

4.  **Ouvrir l'application** :
    - Scannez le code QR affiché dans le terminal avec l'application **Expo Go** (Android) ou l'appareil photo (iOS).
    - Ou appuyez sur `a` pour ouvrir sur un émulateur Android ou `i` pour iOS.

## 📁 Structure du Projet

```text
VocabMaster/
├── assets/             # Images, polices et ressources statiques
├── src/
│   ├── components/     # Composants UI réutilisables
│   ├── constants/      # Couleurs, thèmes et configurations
│   ├── database/       # Logique SQLite (db.js)
│   ├── screens/        # Écrans principaux (Home, AddWord, Quiz)
├── App.js              # Point d'entrée et navigation
└── package.json        # Dépendances et scripts
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request pour améliorer VocabMaster.

---
Développé avec ❤️ pour l'apprentissage des langues.
