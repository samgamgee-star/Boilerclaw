import { queryAll, queryOne } from '@/lib/db';

interface AgentRow {
  id: string;
  name: string;
  role: string;
  status?: string;
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

function findSamAgent(workspaceId: string): AgentRow | null {
  const agents = queryAll<AgentRow>(
    "SELECT id, name, role, status FROM agents WHERE workspace_id = ? AND status != 'offline' ORDER BY updated_at DESC",
    [workspaceId]
  );

  return (
    agents.find((a) => normalize(a.name) === 'sam') ||
    agents.find((a) => normalize(a.name).includes('sam')) ||
    agents.find((a) => normalize(a.role) === 'orchestrator') ||
    agents.find((a) => normalize(a.role).includes('orch')) ||
    null
  );
}

function buildOwnerBasedDefaults(owner: AgentRow, reviewer: AgentRow | null): Record<string, string> {
  const name = normalize(owner.name);
  const role = normalize(owner.role);
  const reviewerId = reviewer?.id || owner.id;

  if (name.includes('coder')) {
    return {
      builder: owner.id,
      tester: owner.id,
      reviewer: reviewerId,
    };
  }

  if (name.includes('speccer') || name.includes('scribe') || name.includes('scout') || name.includes('archivist') || name.includes('forge')) {
    return {
      builder: owner.id,
      tester: reviewerId,
      reviewer: reviewerId,
    };
  }

  if (name.includes('sam') || role.includes('orch')) {
    return {
      builder: owner.id,
      tester: owner.id,
      reviewer: owner.id,
    };
  }

  return {
    builder: owner.id,
    tester: reviewerId,
    reviewer: reviewerId,
  };
}

/**
 * Systematic role defaults for new tasks.
 *
 * Principle:
 * - one primary owner builds/produces
 * - tester validates output
 * - reviewer/approver is usually Sam (the orchestrator)
 * - coder is special-cased to self-test, because coding QA is an internal mode there
 */
export function getDefaultRoleAssignments(taskId: string, workspaceId: string, ownerAgentId?: string | null): Record<string, string> {
  const task = ownerAgentId === undefined ? queryOne<{ assigned_agent_id: string | null }>(
    'SELECT assigned_agent_id FROM tasks WHERE id = ?',
    [taskId]
  ) : { assigned_agent_id: ownerAgentId };

  const sam = findSamAgent(workspaceId);

  if (task?.assigned_agent_id) {
    const owner = queryOne<AgentRow>(
      'SELECT id, name, role, status FROM agents WHERE id = ? LIMIT 1',
      [task.assigned_agent_id]
    );

    if (owner) {
      return buildOwnerBasedDefaults(owner, sam);
    }
  }

  // Fallback for tasks created without an owner: only bind reviewer if Sam exists.
  // Builder/tester can be filled later once the task owner is chosen.
  if (sam) {
    return { reviewer: sam.id };
  }

  return {};
}
