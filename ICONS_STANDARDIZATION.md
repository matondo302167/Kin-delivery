/**
 * ICONS STANDARDIZATION GUIDE
 * 
 * Cette page documente la standardisation des icônes dans l'application KOLISA.
 * 
 * RÈGLES GÉNÉRALES:
 * 1. Toutes les icônes utilisent la librairie "lucide-react"
 * 2. Utiliser le composant IconWrapper pour l'établir la cohérence
 * 3. Les icônes doivent avoir un stroke-width de 2 par défaut
 * 4. Les tailles disponibles: xs (12px), sm (16px), md (20px), lg (24px), xl (32px)
 * 
 * ICÔNES STANDARDISÉES PAR CONTEXTE:
 * 
 * Navigation:
 * - Package: navigation utilisateur, listing de colis
 * - Wallet: gestion des finances et portefeuille
 * - Truck: livraisons et missions courrier
 * - Map: suivi des positions et cartographie
 * - Send: envoyer/créer une nouvelle commande
 * - ListOrdered: liste/historique des commandes
 * - LayoutDashboard: tableau de bord principal
 * - User: profil utilisateur
 * - LogOut: déconnexion
 * 
 * Statuts:
 * - CheckCircle2: statut complété/confirmé
 * - Clock: en attente/en cours
 * - AlertTriangle: alerte/erreur
 * - ShieldAlert: sécurité/vérification
 * - BadgeCheck: vérification/validation
 * 
 * Actions:
 * - ArrowLeft: retour/précédent
 * - ArrowRight: suivant/continuer
 * - Plus: ajouter/créer
 * - Eye: voir/afficher
 * - ChevronRight: détails/drill-down
 * 
 * CONVENTION DE COULEUR:
 * - Primaire (#FACC15): actions principales, accents positifs
 * - Secondaire (#1B5E20): actions secondaires, texte principal
 * - Gris (#9CA3AF): icônes inactives, icônes désactivées
 * - Rouge: alertes, erreurs, déconnexion
 * - Vert: succès, confirmations
 * 
 * EXEMPLES D'UTILISATION:
 * 
 * // Avant (incohérent):
 * <Truck className="h-5 w-5" strokeWidth={1.5} />
 * <Truck className="h-4 w-4" strokeWidth={2} />
 * <Truck className="h-6 w-6" strokeWidth={2.5} />
 * 
 * // Après (homogène):
 * import IconWrapper from "@/components/IconWrapper";
 * 
 * <IconWrapper icon={Truck} size="md" />
 * <IconWrapper icon={Truck} size="sm" />
 * <IconWrapper icon={Truck} size="lg" />
 * 
 * // Avec personnalisation si nécessaire:
 * <IconWrapper icon={Truck} size="md" className="text-primary" />
 * <IconWrapper icon={Truck} size="md" strokeWidth={1.5} />
 * 
 * LOGO:
 * - Le logo KOLISA est maintenant une image PNG depuis /icons/icon-192x192.png
 * - Utiliser le composant KolisaLogo plutôt que d'importer directement l'image
 * - Sizes disponibles: sm (28px), md (36px), lg (48px), xl (64px)
 * - Le logo reste cohérent partout grâce au composant centralisé
 * 
 * MIGRATION:
 * Pour migrer une page vers les icônes standardisées:
 * 1. Importer IconWrapper: import IconWrapper from "@/components/IconWrapper";
 * 2. Remplacer <Truck className="h-5 w-5" /> par <IconWrapper icon={Truck} size="md" />
 * 3. Vérifier que la taille et la couleur correspondent au contexte
 */

