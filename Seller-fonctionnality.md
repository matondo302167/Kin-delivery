# Les Fonctionnalité des vendeurs (temporarie et professionnel)

## 1. Le Vendeur Temporaire 

L'objectif ici est la simplicité absolue. Il ne doit pas se sentir "obligé" de gérer un business.
 - **Accueil** : Un gros bouton **"Envoyer un Colis Now"**.
 - **Formulaire** : Champs simples (Nom du client, Tel, Adresse, Prix de l'article).
 - **Suivi** : Une liste simplifiée sous forme de cartes.
 - **Statut** : Il ne voit pas de statistiques complexes, juste : En attente, En cours, Livré.
 - **Financier** : Pas de portefeuille complexe. Il paie le livreur cash ou reçoit son argent directement du livreur. (À revoir)


## 2. Le Vendeur Pro (Tableau de Bord Business)

C'est ici que ton schéma `seller_details` et `transactions` prend tout son sens.
- **Header** : Nom de sa boutique + Badge "Vérifié".
- Widget Portefeuille : Affiche le Solde Disponible (issu de la fonction get_user_balance). Un bouton "Cash Out" bien visible.
- **Stats** : Nombre de ventes du mois.
  - Top communes de livraison (pour l'aider à savoir où sont ses clients).
- **Gestion des Colis** : Une liste détaillée avec filtre (ex: "Voir uniquement les colis non payés").
- **Action** : Possibilité de générer une étiquette ou un code QR pour le colis.


