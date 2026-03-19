/**
 * Composio Invocation Policy
 *
 * Defines which agent roles are permitted to request Composio-backed
 * external actions, and whether approval is required per action type.
 *
 * Design intent:
 * - Sam (master) is the primary orchestrator; other roles are restricted.
 * - Write/send actions always require explicit approval by default.
 * - Policy is intentionally static and auditable — no dynamic rule loading.
 *
 * See docs/COMPOSIO.md for architecture context.
 */

/** Roles that exist in the agent system. */
export type AgentRole =
  | 'master'
  | 'builder'
  | 'tester'
  | 'reviewer'
  | 'fixer'
  | 'senior'
  | 'speccer'
  | 'scout'
  | 'scribe'
  | 'archivist'
  | 'forge';

/** A declared policy entry for a single Composio action. */
export interface ActionPolicy {
  /** Composio action ID, e.g. 'GMAIL_SEND_EMAIL'. */
  action: string;
  /** Provider slug the action belongs to, e.g. 'gmail'. */
  provider: string;
  /** Roles allowed to invoke this action. */
  allowedRoles: ReadonlySet<AgentRole>;
  /**
   * When true, the invocation must be explicitly approved (e.g. by Sam)
   * before it is dispatched to Composio.
   */
  requiresApproval: boolean;
}

/**
 * Top-level role allowlist.
 * Only roles listed here may invoke *any* Composio action.
 * Action-level policies further restrict within this set.
 */
export const COMPOSIO_ALLOWED_ROLES: ReadonlySet<AgentRole> = new Set([
  'master',  // Sam — primary orchestrator; full access
  'senior',  // Senior specialist — read-only actions permitted
  'scout',   // Scout — read/search actions only
]);

/**
 * Per-action policies.
 * An action not listed here is denied to all roles.
 * Extend this list as real integrations are wired.
 */
export const ACTION_POLICIES: readonly ActionPolicy[] = [
  // Gmail
  {
    action: 'GMAIL_SEND_EMAIL',
    provider: 'gmail',
    allowedRoles: new Set(['master']),
    requiresApproval: true,
  },
  {
    action: 'GMAIL_FETCH_EMAILS',
    provider: 'gmail',
    allowedRoles: new Set(['master', 'senior', 'scout']),
    requiresApproval: false,
  },

  // Google Calendar
  {
    action: 'GOOGLECALENDAR_CREATE_EVENT',
    provider: 'googlecalendar',
    allowedRoles: new Set(['master']),
    requiresApproval: true,
  },
  {
    action: 'GOOGLECALENDAR_LIST_EVENTS',
    provider: 'googlecalendar',
    allowedRoles: new Set(['master', 'senior', 'scout']),
    requiresApproval: false,
  },

  // Google Drive
  {
    action: 'GOOGLEDRIVE_UPLOAD_FILE',
    provider: 'googledrive',
    allowedRoles: new Set(['master']),
    requiresApproval: true,
  },
  {
    action: 'GOOGLEDRIVE_LIST_FILES',
    provider: 'googledrive',
    allowedRoles: new Set(['master', 'senior', 'scout']),
    requiresApproval: false,
  },
];

/**
 * Look up the policy for a specific action.
 * Returns undefined if the action has no declared policy (i.e., denied).
 */
export function getActionPolicy(action: string): ActionPolicy | undefined {
  return ACTION_POLICIES.find((p) => p.action === action);
}

/**
 * Check whether a role is on the top-level Composio allowlist.
 */
export function isRoleAllowed(role: AgentRole): boolean {
  return COMPOSIO_ALLOWED_ROLES.has(role);
}

/**
 * Check whether a specific role may invoke a specific action.
 *
 * Returns false when:
 * - The role is not in the top-level allowlist, OR
 * - The action has no declared policy, OR
 * - The action's policy does not include this role.
 */
export function canInvokeAction(role: AgentRole, action: string): boolean {
  if (!isRoleAllowed(role)) return false;
  const policy = getActionPolicy(action);
  if (!policy) return false;
  return policy.allowedRoles.has(role);
}

/**
 * Check whether a given action requires approval before dispatch.
 * Returns true (safe default) when the action has no declared policy.
 */
export function actionRequiresApproval(action: string): boolean {
  const policy = getActionPolicy(action);
  if (!policy) return true; // unknown action → require approval
  return policy.requiresApproval;
}
