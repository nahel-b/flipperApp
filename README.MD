# Flipper App - Installation


## Prérequis

- Node.js (v14 ou supérieur)
- npm
- Expo CLI installé globalement (`npm install -g expo-cli`)
- Xcode (pour le développement iOS)
- Un appareil physique iOS pour tester les fonctionnalités BLE

non testé :

- Android Studio et un android physique

## Installation

1. Clonez le dépôt
2. Installez les dépendances:

```bash
cd flipperApp
npm install
```

3. Générer les fichiers natifs :

```bash
npx expo prebuild --clean
cd ios
pod install
open flipperApp.xcworkspace
```

4. Ajouter le fichier `Info.plist` dans le dossier `ios/flipperApp/` :

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Cette application nécessite l'accès au Bluetooth pour fonctionner correctement.</string>
```

5. Dans le terminal, exécutez la commande suivante pour démarrer le serveur de développement Expo :

```bash
npx expo start --dev-client
```

6. Dans Xcode, sélectionner l'appareil physique et cliquer sur le bouton play.


## Erreurs potentielles



### L'application ne trouve pas le flipper zero :

Dans le téléphone : Paramètres -> Bluetooth -> Oublier l'appareil


Dans le flipper : 
Settings -> Bluetooth -> Unpair all devices
Settings -> Bluetooth -> Off 
Settings -> Bluetooth -> On 

### Building for iOS, but linking in dylib file built for Mac Catalyst

Mise à jour de Xcode, MacOs et expo.

Exécuter ceci dans /ios :

```bash
rm -rf ~/Library/Caches/CocoaPods
rm -rf Pods
rm -rf ~/Library/Developer/Xcode/DerivedData/*
sudo gem install cocoapods-clean
pod deintegrate
pod clean
pod install
```

Ajouter EXCLUDED_ARCHS=arm64 dans Xcode -> Build Settings


