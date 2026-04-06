import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  bots: defineTable({
    botId: v.string(),
    name: v.string(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    settings: v.optional(v.any()),
    theme: v.optional(v.any()),
    status: v.union(v.literal('Draft'), v.literal('Live')),
    updatedAt: v.number(),
    createdAt: v.number(),
  }).index('by_bot_id', ['botId']),
});
