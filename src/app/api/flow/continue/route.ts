import { flowEngine, FlowEngineError } from '@/lib/flowRuntime/flowEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.sessionId) {
      return Response.json({ error: 'sessionId is required.', code: 'SESSION_ID_REQUIRED' }, { status: 400 });
    }

    const result = await flowEngine.continueFlow({
      sessionId: body.sessionId,
      value: body.value ?? body.input ?? '',
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
