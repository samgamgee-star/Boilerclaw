/**
 * Composio Integration Registry
 *
 * Declares which external providers and their actions are known to this system.
 * This is a static manifest — it does not talk to the Composio API.
 *
 * Purpose: give the rest of the codebase a typed, central place to look up
 * available providers without scattering magic strings everywhere.
 *
 * NOTE: Listed actions are stubs. Wire real SDK calls in adapter.ts once
 * COMPOSIO_ENABLED=true and the SDK package is installed.
 */

export interface ComposioProvider {
  /** Stable identifier used in policy rules and adapter routing. */
  id: string;
  displayName: string;
  /** Action IDs this provider exposes. Must match Composio's action names. */
  actions: readonly string[];
}

const REGISTRY: readonly ComposioProvider[] = [
  {
    id: 'gmail',
    displayName: 'Gmail',
    actions: ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS'],
  },
  {
    id: 'googlecalendar',
    displayName: 'Google Calendar',
    actions: ['GOOGLECALENDAR_CREATE_EVENT', 'GOOGLECALENDAR_LIST_EVENTS'],
  },
  {
    id: 'googledrive',
    displayName: 'Google Drive',
    actions: ['GOOGLEDRIVE_UPLOAD_FILE', 'GOOGLEDRIVE_LIST_FILES'],
  },
];

/** Return all registered providers. */
export function listProviders(): readonly ComposioProvider[] {
  return REGISTRY;
}

/** Look up a provider by its stable ID. Returns undefined if not registered. */
export function getProvider(id: string): ComposioProvider | undefined {
  return REGISTRY.find((p) => p.id === id);
}

/**
 * Find which provider owns a given action ID.
 * Useful when you have an action string and need the provider context.
 */
export function getProviderForAction(action: string): ComposioProvider | undefined {
  return REGISTRY.find((p) => p.actions.includes(action));
}
