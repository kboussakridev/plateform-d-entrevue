import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schéma de base de données pour l'application de gestion de recrutement.
 *
 * Ce schéma utilise Convex pour la persistance des données et définit
 * la structure des différentes entités métier de l'application.
 *
 * Organisation :
 * - Chaque table est définie avec ses champs et leurs validateurs
 * - Les index sont créés pour optimiser les requêtes fréquentes
 * - Les relations entre tables sont établies via des références d'ID
 */
export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(
      v.literal("candidat"),
      v.literal("candidate"),
      v.literal("entretien"),
    ),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),
});
