import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Ajouter un nouveau commentaire
export const addComment = mutation({
    args: {
        interviewId: v.id("interviews"),
        content: v.string(),
        rating: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Utilisateur non authentifié");

        return await ctx.db.insert("comments", {
            interviewId: args.interviewId,
            content: args.content,
            rating: args.rating,
            interviewerId: identity.subject,
        });
    },
});

// Récupérer tous les commentaires d'une entretien
export const getComments = query({
    args: {
        interviewId: v.id("interviews"),
    },
    // On vérifie que l'utilisateur est authentifié
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_interview_id", (q) => q.eq("interviewId", args.interviewId))
            .collect();
        return comments;
    },
});
