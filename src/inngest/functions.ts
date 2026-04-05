import { inngest } from "@/inngest/client";
import {
  evaluateCondition,
  findBlockEdge,
  getInputBranchKey,
  getInputBranches,
  getBlockSummary,
  migrateToBlocks,
  resolveTemplate,
  type GroupNodeData,
  type LogicBlock,
  type SetVariableBlock,
  type ConditionBlock,
} from "@/lib/blocks";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event }) => {
    return {
      ok: true,
      message: `Hello ${event.data?.name ?? "World"} from Inngest`,
      at: new Date().toISOString(),
    };
  }
);

type FlowLikeNode = {
  id: string;
  type?: string;
  data?: unknown;
};

type FlowLikeEdge = {
  id?: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
};

type FlowExecuteEventData = {
  flow?: {
    nodes?: FlowLikeNode[];
    edges?: FlowLikeEdge[];
  };
  payload?: {
    flow?: {
      nodes?: FlowLikeNode[];
      edges?: FlowLikeEdge[];
    };
  };
  inputs?: Record<string, string>;
  maxSteps?: number;
};

export const executeCanvasFlow = inngest.createFunction(
  { id: "execute-canvas-flow", triggers: [{ event: "flow/execute.requested" }] },
  async ({ event, step, logger }) => {
    return step.run("execute-flow-runtime", async () => {
      const data = (event.data || {}) as FlowExecuteEventData;
      const flow = data.flow || data.payload?.flow;
      const nodes = flow?.nodes || [];
      const edges = flow?.edges || [];
      const inputs = data.inputs || {};
      const maxSteps = Math.max(1, Math.min(data.maxSteps ?? 300, 1000));

      if (!nodes.length) {
        return { ok: false, error: "No nodes found in flow payload." };
      }

      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      const startNode = nodes.find((node) => node.type === "start") || nodes[0];
      const firstEdge = edges.find((edge) => edge.source === startNode.id);

      if (!firstEdge) {
        return { ok: false, error: `Start node "${startNode.id}" has no outgoing edge.` };
      }

      const visitedNodeIds: string[] = [];
      const transcript: Array<{ type: "bot" | "system" | "input"; message: string }> = [];
      const variables: Record<string, string> = {};
      let currentNodeId: string | null = firstEdge.target;
      let currentIndex = 0;
      let steps = 0;

      while (currentNodeId) {
        steps += 1;
        if (steps > maxSteps) {
          transcript.push({ type: "system", message: `Execution stopped at ${maxSteps} steps (loop protection).` });
          break;
        }

        const node = nodeById.get(currentNodeId);
        if (!node) {
          transcript.push({ type: "system", message: `Node "${currentNodeId}" not found.` });
          break;
        }

        visitedNodeIds.push(currentNodeId);

        if (node.type !== "group") {
          const fallback = edges.find((edge) => edge.source === currentNodeId);
          currentNodeId = fallback?.target || null;
          currentIndex = 0;
          continue;
        }

        const groupData = (node.data || {}) as GroupNodeData;
        const blocks = migrateToBlocks(groupData);
        let jumped = false;

        for (let index = currentIndex; index < blocks.length; index += 1) {
          const block = blocks[index];

          if (block.kind === "bubble") {
            transcript.push({
              type: "bot",
              message: resolveTemplate(getBlockSummary(block, variables), variables),
            });
            const edge = findBlockEdge(edges, currentNodeId, block.id);
            if (edge) {
              currentNodeId = edge.target;
              currentIndex = 0;
              jumped = true;
              break;
            }
            continue;
          }

          if (block.kind === "input") {
            const chosen = (inputs[block.variable] || "").trim();
            if (chosen) {
              variables[block.variable] = chosen;
              transcript.push({ type: "input", message: `${block.variable} = ${chosen}` });
            } else {
              transcript.push({ type: "input", message: `${block.variable} missing; using empty value.` });
              variables[block.variable] = "";
            }

            const branches = getInputBranches(block);
            const branch = branches.find((item) => item.value === variables[block.variable]);
            const branchEdge = branch
              ? findBlockEdge(edges, currentNodeId, block.id, getInputBranchKey(branch.value))
              : null;
            const edge = branchEdge || findBlockEdge(edges, currentNodeId, block.id);
            if (edge) {
              currentNodeId = edge.target;
              currentIndex = 0;
              jumped = true;
              break;
            }
            continue;
          }

          const logic = block as LogicBlock;
          if (logic.type === "set_variable") {
            const setVariable = logic as SetVariableBlock;
            variables[setVariable.variable] = resolveTemplate(setVariable.value, variables);
            transcript.push({
              type: "system",
              message: `Set ${setVariable.variable} = ${variables[setVariable.variable]}`,
            });
            const edge = findBlockEdge(edges, currentNodeId, logic.id);
            if (edge) {
              currentNodeId = edge.target;
              currentIndex = 0;
              jumped = true;
              break;
            }
            continue;
          }

          if (logic.type === "condition") {
            const condition = logic as ConditionBlock;
            const pass = evaluateCondition(condition, variables);
            transcript.push({
              type: "system",
              message: `Condition ${getBlockSummary(condition, variables)} => ${pass ? "true" : "false"}`,
            });
            const edge = findBlockEdge(edges, currentNodeId, condition.id, pass ? "true" : "false");
            if (edge) {
              currentNodeId = edge.target;
              currentIndex = 0;
              jumped = true;
              break;
            }
            continue;
          }

          transcript.push({ type: "system", message: resolveTemplate(logic.label, variables) });
          const edge = findBlockEdge(edges, currentNodeId, logic.id);
          if (edge) {
            currentNodeId = edge.target;
            currentIndex = 0;
            jumped = true;
            break;
          }
        }

        if (jumped) continue;

        const fallback = findBlockEdge(edges, currentNodeId, null);
        if (fallback) {
          currentNodeId = fallback.target;
          currentIndex = 0;
          continue;
        }

        currentNodeId = null;
      }

      logger.info("Flow execution completed", {
        visitedCount: visitedNodeIds.length,
        variableCount: Object.keys(variables).length,
      });

      return {
        ok: true,
        visitedNodeIds,
        variables,
        transcript,
      };
    });
  }
);
