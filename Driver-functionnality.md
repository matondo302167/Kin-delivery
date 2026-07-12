# Driver Functionnality 

## 3. Le Livreur (Outil de Travail)
    
L'interface doit être utilisable à une main, souvent sous le soleil. 

- **Mode Service** : Un switch "Disponible / Occupé" (qui met à jour `driver_details.is_active)`.
- **La Carte (Map)** : Affiche sa position actuelle et les points de "ramassage" disponibles autour de lui.

- **Détail Course** : * Bouton GPS (ouvre Google Maps/Waze).
  - Bouton Appel Client.
  - Champ de saisie du Code OTP pour valider la livraison.

- **Portefeuille Livreur** :
  - **Earnings** : Ses commissions accumulées.
  - **Cash to Return** : Sa dette envers Kolisa (somme des `article_price` encaissés).
