# FanBar — contrôle des ventilateurs du Mac, gratuit et open source

Page canonique : https://getfanbar.com/fr / English: https://getfanbar.com/

FanBar est une app gratuite et open source (GPL-3.0) pour la barre des menus de macOS. Elle affiche les températures du CPU, du GPU, du SSD et de la batterie ainsi que la vitesse des ventilateurs, et permet de fixer une vitesse ou une courbe température → vitesse. Elle fonctionne sous macOS 11 Big Sur et ultérieur, sur les Mac Apple Silicon et Intel qui exposent les données des ventilateurs via AppleSMC.

Langues de l’interface : English, 简体中文, 繁體中文, 日本語, Русский, Français. Changez-la dans Réglages → Général → Langue de l’interface, sans redémarrer.

## Fonctions

- Sous macOS 14 ou ultérieur : vitesse, température du CPU et mode sur le bureau. Le système gère la fréquence d’actualisation.
- Température et vitesse dans la barre des menus ; six icônes qui tournent avec les ventilateurs ; widget de bureau (macOS 14+)
- Vitesse de chaque ventilateur sur une jauge de 0 au maximum, grille de charge CPU, GPU, mémoire et disque, graphique des températures des dix dernières minutes
- Modes : Automatique, vitesse fixe, profils Silencieux, Équilibré, Performance et Extrême avec courbes modifiables
- Source de température de la courbe : CPU, GPU ou SSD
- Alertes de surchauffe facultatives : seuil de 60 à 105 °C (90 °C par défaut) et son au choix ; en cas de surchauffe, refroidissement maximal en un clic
- Journal CSV : températures, vitesses et mode toutes les 2 à 60 secondes
- Ligne de commande et Raycast : l’outil `fanbar` lit l’état, change de préréglage, fixe un régime ou revient en automatique (depuis la 0.7.0)

## Sécurité

- Le contrôle manuel n’est disponible qu’après l’autorisation explicite du helper signé dans macOS. La surveillance n’en a pas besoin.
- Le helper (root) lit seulement les ventilateurs, fixe une vitesse dans la plage de chacun et rétablit le contrôle automatique. Aucune écriture SMC arbitraire.
- FanBar tente de rétablir le contrôle automatique de macOS quand l’app quitte, perd la connexion, quand le helper échoue ou quand un profil expire.
- En détail (en anglais) : https://getfanbar.com/is-fanbar-safe

## Téléchargement

Uniquement depuis GitHub Releases (https://github.com/helson-lin/FanBar/releases/latest) ou Homebrew :

```sh
brew tap helson-lin/fanbar https://github.com/helson-lin/FanBar.git
brew install --cask helson-lin/fanbar/fanbar
```

Déjà installé via DMG ? Quittez FanBar et placez l’app existante /Applications/FanBar.app dans la Corbeille avant de l’installer avec Homebrew.

Documentation : https://github.com/helson-lin/FanBar/blob/main/README.fr.md
