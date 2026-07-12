# 📦 Documentation Fonctionnelle - KOLISA (2026)
*Système de logistique intégrée avec Portefeuille Virtuel et Suivi Temps Réel*

---

## 📑 Sommaire
1. [Profils Utilisateurs](#1-profils-utilisateurs)
2. [Gestion des Colis (Lifecycle)](#2-gestion-des-colis-lifecycle)
3. [Logique du Portefeuille Virtuel](#3-logique-du-portefeuille-virtuel)
4. [Politique d'Annulation](#4-politique-dannulation)
5. [Interface & Expérience Utilisateur (UX)](#5-interface--expérience-utilisateur-ux)

---

## 1. Profils Utilisateurs

L'architecture repose sur une table centrale `profiles` avec des extensions spécifiques :

* **Vendeur Temporaire :** Utilisateur occasionnel. Interface simplifiée (envoi rapide). Pas de boutique publique.
* **Vendeur Pro :** Possède une boutique (`seller_details`). Accès aux statistiques avancées et gestion de stock.
* **Livreur :** Professionnel de la route (`driver_details`). Gère un véhicule, une caution et un score de fiabilité.
* **Admin :** Superviseur du réseau, valide les retraits (Cash-out) et gère les litiges.

---

## 2. Gestion des Colis (Lifecycle)

Chaque livraison suit un flux d'états strict pour garantir la sécurité des fonds :

1.  **Pending (En attente) :** Le vendeur a créé la commande. Elle est visible sur la carte des livreurs.
2.  **Picked Up (Récupéré) :** Le livreur a scanné ou validé la récupération à la boutique.
3.  **In Transit (En route) :** Le livreur se déplace vers le client. Le tracking GPS est actif.
4.  **Delivered (Livré) :** Le client a fourni le code PIN secret au livreur. Les fonds sont débloqués.



---

## 3. Logique du Portefeuille Virtuel

Le système utilise une table `transactions` (Ledger) pour calculer les soldes en temps réel.

### Pour le Vendeur
- **Crédit :** `article_price` (après livraison réussie).
- **Débit :** `delivery_fee` (si à sa charge) et `withdrawal` (Cash-out).

### Pour le Livreur
- **Commission :** Gain net sur la course (`delivery_fee` - commission Kolisa).
- **Dette Cash :** Valeur totale de l'article + frais encaissés chez le client (montant négatif à rembourser).
- **Caution :** Dépôt de garantie nécessaire pour accepter des courses de grande valeur.

---

## 4. Politique d'Annulation

| Moment | Annulation par Vendeur | Annulation par Livreur |
| :--- | :--- | :--- |
| **Pending** | Gratuite | N/A |
| **Picked Up** | Pénalité (frais de déplacement) | Baisse du score de fiabilité |
| **In Transit** | Course totale due | Bloqué (Appel Admin requis) |

---

## 5. Interface & Expérience Utilisateur (UX)

### Page de Suivi (Public Tracking)
* **Carte Temps Réel :** Utilise la table `driver_locations`. La moto bouge via Supabase Realtime.
* **Success State :** Dès que le statut passe à `delivered`, une modale de succès s'affiche et le tracking GPS s'arrête par respect pour la vie privée du livreur.

### Dashboard Vendeur Pro
* **Widget Portefeuille :** Solde actuel calculé via la fonction SQL `get_user_balance`.
* **Stats :** Volume de ventes, revenus hebdomadaires et zones de livraison les plus actives.

### Dashboard Livreur
* **Wallet :** Distinction claire entre "Mes Gains" et "Argent à reverser (Cash Debt)".
* **Navigation :** Intégration directe avec Google Maps/Waze et bouton d'appel client.

---

## 🛠 Architecture Technique (Rappel)

- **Frontend :** React (PWA) + Tailwind CSS.
- **Backend :** Supabase (PostgreSQL + Realtime).
- **Paiements :** Agrégateur API (ex: FlexPay) pour le STK Push (M-Pesa/Airtel).
- **Tracking :** `navigator.geolocation` -> `driver_locations` table.

---
© 2026 KOLISA - Document de spécifications techniques.
