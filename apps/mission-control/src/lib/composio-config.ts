/**
 * Composio Configuration
 *
 * Server-side typed accessors for Composio-related environment variables.
 * All values come from process.env — never hardcode credentials here.
 *
 * See .env.example for the full variable list.
 * See docs/COMPOSIO.md for architecture context.
 */

export interface ComposioConfig {
  /** Whether the Composio capability layer is active. Default: false. */
  enabled: boolean;
  /** Composio API key. Required when enabled. */
  apiKey: string | null;
  /** Composio API base URL. Defaults to the public Composio backend. */
  baseUrl: string;
  /** Optional connected-account / workspace reference used as a default. */
  connectedAccountId: string | null;
  /** When true, Sam must explicitly approve before any write action is dispatched. */
  requireApproval: boolean;
}

const COMPOSIO_DEFAULT_BASE_URL = 'https://backend.composio.dev';

/**
 * Read Composio configuration from environment variables.
 * Server-side only.
 */
export function getComposioConfig(): ComposioConfig {
  return {
    enabled: process.env.COMPOSIO_ENABLED === 'true',
    apiKey: process.env.COMPOSIO_API_KEY || null,
    baseUrl: process.env.COMPOSIO_BASE_URL || COMPOSIO_DEFAULT_BASE_URL,
    connectedAccountId: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID || null,
    requireApproval: process.env.COMPOSIO_REQUIRE_APPROVAL !== 'false', // default: true
  };
}

/**
 * Quick guard — use this before any Composio code path to avoid
 * calling into a disabled or misconfigured layer.
 */
export function isComposioEnabled(): boolean {
  return getComposioConfig().enabled;
}

/**
 * Assert that the Composio layer is configured enough to use.
 * Throws if enabled but missing required fields.
 * Stubbed — extend when the adapter is wired.
 */
export function assertComposioReady(): void {
  const cfg = getComposioConfig();
  if (!cfg.enabled) {
    throw new Error('Composio is disabled (COMPOSIO_ENABLED != true)');
  }
  if (!cfg.apiKey) {
    throw new Error('Composio is enabled but COMPOSIO_API_KEY is not set');
  }
}
