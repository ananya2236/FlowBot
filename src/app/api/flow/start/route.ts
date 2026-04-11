import { flowEngine, FlowEngineError } from '@/lib/flowRuntime/flowEngine';
import type { RuntimeFlow } from '@/lib/flowRuntime/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await flowEngine.startFlow({
      flow: body.flow as RuntimeFlow,
      variables: body.variables || body.inputs || {},
    });

    return Response.json(result);
  } catch (error) {
    return handleFlowError(error);
  }
}

function handleFlowError(error: unknown) {
  if (error instanceof FlowEngineError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Unknown flow execution error.';
  return Response.json({ error: message, code: 'FLOW_EXECUTION_ERROR' }, { status: 500 });
}
