import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const bots = await ctx.db.query('bots').collect();

    return bots
      .map((bot) => ({
        id: bot.botId,
        name: bot.name,
        nodes: bot.nodes,
        edges: bot.edges,
        settings: bot.settings,
        theme: bot.theme,
        status: bot.status,
        updatedAt: bot.updatedAt,
        createdAt: bot.createdAt,
      }))
      .sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const upsert = mutation({
  args: {
    bot: v.object({
      id: v.string(),
      name: v.string(),
      nodes: v.array(v.any()),
      edges: v.array(v.any()),
      settings: v.optional(v.any()),
      theme: v.optional(v.any()),
      status: v.union(v.literal('Draft'), v.literal('Live')),
      updatedAt: v.number(),
      createdAt: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { bot }) => {
    const existing = await ctx.db
      .query('bots')
      .withIndex('by_bot_id', (q) => q.eq('botId', bot.id))
      .unique();

    const payload = {
      botId: bot.id,
      name: bot.name,
      nodes: bot.nodes,
      edges: bot.edges,
      settings: bot.settings,
      theme: bot.theme,
      status: bot.status,
      updatedAt: bot.updatedAt,
      createdAt: bot.createdAt ?? bot.updatedAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert('bots', payload);
  },
});

export const remove = mutation({
  args: {
    botId: v.string(),
  },
  handler: async (ctx, { botId }) => {
    const existing = await ctx.db
      .query('bots')
      .withIndex('by_bot_id', (q) => q.eq('botId', botId))
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.delete(existing._id);
    return existing._id;
  },
});
