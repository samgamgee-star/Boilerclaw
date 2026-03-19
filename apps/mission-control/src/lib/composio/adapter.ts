/**
 * Composio Adapter (stub)
 *
 * Defines the invocation interface and a placeholder audit hook.
 * The actual SDK call is NOT implemented — this is honest scaffolding.
 *
 * When you are ready to wire the real Composio SDK:
 *   1. Install the SDK:  npm install composio-core
 *   2. Replace the body of invokeComposioAction() with real SDK calls.
 *   3. Keep auditComposioInvocation() wired — point it at the events table
 *      or the Mission Control activity log rather than console.log.
 *
 * See docs/COMPOSIO.md for the intended invocation flow.
 */

export interface ComposioActionInput {
  /** Provider slug, e.g. 'notion'. */
  provider: string;
  /** Composio action ID, e.g. 'NOTION_GET_PAGE'. */
  action: string;
  /** Action parameters — shape depends on the action. */
  params: Record<string, unknown>;
  /** Who is requesting the action. Used for audit and policy checks. */
  requestedBy: {
    agentId: string;
    agentRole: string;
  };
  /** Optional task ID for Mission Control activity correlation. */
  taskId?: string;
}

export interface ComposioActionResult {
  success: boolean;
  /** Raw response data from Composio when successful. */
  data?: unknown;
  /** Error message when unsuccessful. */
  error?: string;
}

/**
 * Audit hook — called for every invocation attempt, success or failure.
 *
 * Currently logs to console. Replace with a structured write to the
 * events table (see task-governance.ts → auditBoardOverride for the pattern)
 * once the adapter is production-ready.
 */
export function auditComposioInvocation(
  input: ComposioActionInput,
  result: ComposioActionResult,
): void {
  // TODO: write to events table for persistent audit trail
  console.log(
    '[composio:audit]',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      provider: input.provider,
      action: input.action,
      requestedBy: input.requestedBy,
      taskId: input.taskId ?? null,
      success: result.success,
      error: result.error ?? null,
    }),
  );
}

/**
 * Invoke a Composio action.
 *
 * STUB — always throws. Replace with real SDK call when ready.
 * The audit hook is called before the throw so invocation attempts
 * are always recorded.
 */
export async function invokeComposioAction(
  input: ComposioActionInput,
): Promise<ComposioActionResult> {
  const result: ComposioActionResult = {
    success: false,
    error: 'not_implemented',
  };

  auditComposioInvocation(input, result);

  throw new Error(
    `Composio adapter is not yet implemented. ` +
      `Set COMPOSIO_ENABLED=true and wire the SDK in src/lib/composio/adapter.ts.`,
  );
}
