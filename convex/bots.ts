import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const bots = await ctx.db.query('bots').collect();
    const latestByBotId = new Map<string, (typeof bots)[number]>();

    for (const bot of bots) {
      const existing = latestByBotId.get(bot.botId);
      if (!existing || bot.updatedAt > existing.updatedAt) {
        latestByBotId.set(bot.botId, bot);
      }
    }

    return Array.from(latestByBotId.values())
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

export const cleanupDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const bots = await ctx.db.query('bots').collect();
    const orderedBots = [...bots].sort((left, right) => right.updatedAt - left.updatedAt);

    const seenBotIds = new Set<string>();
    const botDocIdsToDelete: typeof orderedBots[number]['_id'][] = [];

    for (const bot of orderedBots) {
      if (seenBotIds.has(bot.botId)) {
        botDocIdsToDelete.push(bot._id);
        continue;
      }

      seenBotIds.add(bot.botId);
    }

    for (const botDocId of botDocIdsToDelete) {
      await ctx.db.delete(botDocId);
    }

    const revisions = await ctx.db.query('botRevisions').collect();
    const orphanRevisionIds = revisions
      .filter((revision) => !seenBotIds.has(revision.botId))
      .map((revision) => revision._id);

    for (const revisionId of orphanRevisionIds) {
      await ctx.db.delete(revisionId);
    }

    return {
      deletedBotDocuments: botDocIdsToDelete.length,
      deletedOrphanRevisions: orphanRevisionIds.length,
      remainingUniqueBots: seenBotIds.size,
    };
  },
});

export const cleanupToNewest = mutation({
  args: {},
  handler: async (ctx) => {
    const bots = await ctx.db.query('bots').collect();
    if (bots.length <= 1) {
      return {
        keptBotId: bots[0]?.botId ?? null,
        deletedBots: 0,
        deletedRelatedRevisions: 0,
      };
    }

    const orderedBots = [...bots].sort((left, right) => right.updatedAt - left.updatedAt);
    const newestBot = orderedBots[0];
    const botsToDelete = orderedBots.slice(1);
    const botIdsToDelete = new Set(botsToDelete.map((bot) => bot.botId));

    for (const bot of botsToDelete) {
      await ctx.db.delete(bot._id);
    }

    const revisions = await ctx.db.query('botRevisions').collect();
    const revisionsToDelete = revisions.filter((revision) => botIdsToDelete.has(revision.botId));
    for (const revision of revisionsToDelete) {
      await ctx.db.delete(revision._id);
    }

    return {
      keptBotId: newestBot.botId,
      deletedBots: botsToDelete.length,
      deletedRelatedRevisions: revisionsToDelete.length,
    };
  },
});

export const revisions = query({
  args: {
    botId: v.string(),
  },
  handler: async (ctx, { botId }) => {
    const revisions = await ctx.db
      .query('botRevisions')
      .withIndex('by_bot_id', (q) => q.eq('botId', botId))
      .collect();

    return revisions
      .map((revisionDoc) => ({
        revision: revisionDoc.revision,
        botId: revisionDoc.botId,
        name: revisionDoc.name,
        nodes: revisionDoc.nodes,
        edges: revisionDoc.edges,
        settings: revisionDoc.settings,
        theme: revisionDoc.theme,
        status: revisionDoc.status,
        updatedAt: revisionDoc.updatedAt,
        createdAt: revisionDoc.createdAt,
        savedAt: revisionDoc.savedAt,
      }))
      .sort((left, right) => right.revision - left.revision);
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
    const existingBots = await ctx.db
      .query('bots')
      .withIndex('by_bot_id', (q) => q.eq('botId', bot.id))
      .collect();

    const sortedExistingBots = [...existingBots].sort((left, right) => right.updatedAt - left.updatedAt);
    const existing = sortedExistingBots[0] ?? null;
    const duplicateBots = sortedExistingBots.slice(1);

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

    const shouldCreateRevision =
      !existing ||
      existing.name !== payload.name ||
      existing.status !== payload.status ||
      existing.updatedAt !== payload.updatedAt ||
      JSON.stringify(existing.nodes) !== JSON.stringify(payload.nodes) ||
      JSON.stringify(existing.edges) !== JSON.stringify(payload.edges) ||
      JSON.stringify(existing.settings ?? null) !== JSON.stringify(payload.settings ?? null) ||
      JSON.stringify(existing.theme ?? null) !== JSON.stringify(payload.theme ?? null);

    let revision = 1;
    if (shouldCreateRevision) {
      const previousRevisions = await ctx.db
        .query('botRevisions')
        .withIndex('by_bot_id', (q) => q.eq('botId', bot.id))
        .collect();

      revision =
        previousRevisions.reduce((maxRevision, item) => Math.max(maxRevision, item.revision), 0) + 1;
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      for (const duplicateBot of duplicateBots) {
        await ctx.db.delete(duplicateBot._id);
      }
      if (shouldCreateRevision) {
        await ctx.db.insert('botRevisions', {
          ...payload,
          revision,
          savedAt: Date.now(),
        });
      }
      return existing._id;
    }

    const insertedId = await ctx.db.insert('bots', payload);
    if (shouldCreateRevision) {
      await ctx.db.insert('botRevisions', {
        ...payload,
        revision,
        savedAt: Date.now(),
      });
    }
    return insertedId;
  },
});

export const remove = mutation({
  args: {
    botId: v.string(),
  },
  handler: async (ctx, { botId }) => {
    const existingBots = await ctx.db
      .query('bots')
      .withIndex('by_bot_id', (q) => q.eq('botId', botId))
      .collect();

    const relatedRevisions = await ctx.db
      .query('botRevisions')
      .withIndex('by_bot_id', (q) => q.eq('botId', botId))
      .collect();

    if (existingBots.length === 0) {
      for (const revision of relatedRevisions) {
        await ctx.db.delete(revision._id);
      }
      return null;
    }

    for (const existing of existingBots) {
      await ctx.db.delete(existing._id);
    }
    for (const revision of relatedRevisions) {
      await ctx.db.delete(revision._id);
    }

    return existingBots[0]._id;
  },
});

export const addVideoToGroup1 = mutation({
  args: {},
  handler: async (ctx) => {
    const bots = await ctx.db.query('bots').collect();
    if (bots.length === 0) {
      return { updated: false, reason: 'no_bots_found' };
    }

    const newestBot = [...bots].sort((left, right) => right.updatedAt - left.updatedAt)[0];
    const nodes = [...newestBot.nodes];

    const targetNodeIndex = nodes.findIndex((node) => {
      const nodeData = (node.data ?? {}) as { title?: string };
      return node.type === 'group' && typeof nodeData.title === 'string' && nodeData.title.toLowerCase() === 'group #1';
    });

    if (targetNodeIndex === -1) {
      return { updated: false, reason: 'group_1_not_found', botId: newestBot.botId };
    }

    const targetNode = nodes[targetNodeIndex] as {
      data?: {
        title?: string;
        blocks?: Array<{ id?: string; kind?: string; type?: string }>;
        activeBlockId?: string | null;
      };
    };

    const data = targetNode.data ?? {};
    const existingBlocks = Array.isArray(data.blocks) ? [...data.blocks] : [];
    const alreadyHasVideo = existingBlocks.some(
      (block) => block?.kind === 'bubble' && block?.type === 'video'
    );

    if (alreadyHasVideo) {
      return { updated: false, reason: 'video_already_exists', botId: newestBot.botId };
    }

    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    const videoBlockId = `video_${Date.now()}`;
    const nextBlocks = [
      ...existingBlocks,
      {
        id: videoBlockId,
        kind: 'bubble',
        type: 'video',
        content: videoUrl,
        attachmentSource: 'link',
        attachmentUrl: videoUrl,
        maxFileSizeMb: 10,
        maxQuantity: 10,
      },
    ];

    nodes[targetNodeIndex] = {
      ...(nodes[targetNodeIndex] as object),
      data: {
        ...data,
        blocks: nextBlocks,
        activeBlockId: videoBlockId,
      },
    };

    const updatedAt = Date.now();
    await ctx.db.patch(newestBot._id, {
      nodes,
      updatedAt,
    });

    const previousRevisions = await ctx.db
      .query('botRevisions')
      .withIndex('by_bot_id', (q) => q.eq('botId', newestBot.botId))
      .collect();
    const revision = previousRevisions.reduce((maxRevision, item) => Math.max(maxRevision, item.revision), 0) + 1;

    await ctx.db.insert('botRevisions', {
      botId: newestBot.botId,
      revision,
      name: newestBot.name,
      nodes,
      edges: newestBot.edges,
      settings: newestBot.settings,
      theme: newestBot.theme,
      status: newestBot.status,
      createdAt: newestBot.createdAt,
      updatedAt,
      savedAt: updatedAt,
    });

    return {
      updated: true,
      botId: newestBot.botId,
      groupTitle: ((data.title as string | undefined) ?? 'Group #1'),
      addedBlockId: videoBlockId,
    };
  },
});
