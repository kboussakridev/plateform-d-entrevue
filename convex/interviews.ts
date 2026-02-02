import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Récupère MES entretiens (candidat ou interviewer)
 */
export const getMyInterviews = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("interviews")
            .withIndex("by_candidate_id", (q) =>
                q.eq("candidateId", identity.subject)
            )
            .collect();
    },
});

/**
 * Récupère UN entretien par streamCallId
 */
export const getInterviewByStreamCallId = query({
    args: {
        streamCallId: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non authentifié");

        return await ctx.db
            .query("interviews")
            .withIndex("by_stream_call_id", (q) =>
                q.eq("streamCallId", args.streamCallId)
            )
            .first();
    },
});

/**
 * Crée un entretien
 */
export const createInterview = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        startTime: v.number(),
        status: v.string(),
        streamCallId: v.string(),
        candidateId: v.string(),
        interviewerIds: v.array(v.string()),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non authentifié");

        // Optionnel : vérifier que le user est bien le candidat
        if (identity.subject !== args.candidateId) {
            throw new Error("Non autorisé");
        }

        return await ctx.db.insert("interviews", {
            title: args.title,
            description: args.description,
            startTime: args.startTime,
            status: args.status,
            streamCallId: args.streamCallId,
            candidateId: args.candidateId,
            interviewerIds: args.interviewerIds,
        });
    },
});

/**
 * Met à jour le statut d'un entretien
 */
export const updateInterviewStatus = mutation({
    args: {
        id: v.id("interviews"),
        status: v.string(),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Non authentifié");

        return await ctx.db.patch(args.id, {
            status: args.status,
            ...(args.status === "completed"
                ? { endTime: Date.now() }
                : {}),
        });
    },
});
