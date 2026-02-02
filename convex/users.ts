import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Mutation pour créer ou mettre à jour un utilisateur
 * appelée depuis le webhook Clerk
 */
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    // On cherche si l’utilisateur existe déjà via son clerkId
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    // ----- SI L'UTILISATEUR EXISTE DÉJÀ -----

    if (existingUser) return;
    // ----- SINON ON CRÉE UN NOUVEL UTILISATEUR -----
    return await ctx.db.insert("users", {
      ...args,
      role: "candidate",
    });
  },
});
/**
 * Récupérer un utilisateur par son clerkId
 */
export const getUsers = query({
  // On vérifie que l'utilisateur est authentifié
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Utilisateur non authentifié");
    // On récupère tous les utilisateurs
    const users = await ctx.db.query("users").collect();
    return users;
  },
});
/**
 * Récupérer un utilisateur par son clerkId
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),// le clerkId est l'identifiant unique de l'utilisateur dans clerk
  },
  handler: async (ctx, args) => {
    // On vérifie que l'utilisateur est authentifié
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Utilisateur non authentifié");
    // On récupère l'utilisateur via son clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
})


