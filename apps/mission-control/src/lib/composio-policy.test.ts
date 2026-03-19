import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRoleAllowed,
  canInvokeAction,
  actionRequiresApproval,
  getActionPolicy,
  COMPOSIO_ALLOWED_ROLES,
} from './composio-policy';

// --- Top-level role allowlist ---

test('master role is on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('master'), true);
});

test('senior role is on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('senior'), true);
});

test('scout role is on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('scout'), true);
});

test('builder role is NOT on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('builder'), false);
});

test('tester role is NOT on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('tester'), false);
});

test('reviewer role is NOT on the top-level allowlist', () => {
  assert.equal(isRoleAllowed('reviewer'), false);
});

// --- canInvokeAction (Notion — first integration target) ---

test('master can invoke NOTION_GET_PAGE (read)', () => {
  assert.equal(canInvokeAction('master', 'NOTION_GET_PAGE'), true);
});

test('scout can invoke NOTION_GET_PAGE (read action)', () => {
  assert.equal(canInvokeAction('scout', 'NOTION_GET_PAGE'), true);
});

test('senior can invoke NOTION_QUERY_DATABASE (read action)', () => {
  assert.equal(canInvokeAction('senior', 'NOTION_QUERY_DATABASE'), true);
});

test('master can invoke NOTION_CREATE_PAGE (write)', () => {
  assert.equal(canInvokeAction('master', 'NOTION_CREATE_PAGE'), true);
});

test('scout cannot invoke NOTION_CREATE_PAGE (write action)', () => {
  assert.equal(canInvokeAction('scout', 'NOTION_CREATE_PAGE'), false);
});

test('senior cannot invoke NOTION_UPDATE_PAGE (write action)', () => {
  assert.equal(canInvokeAction('senior', 'NOTION_UPDATE_PAGE'), false);
});

test('builder cannot invoke NOTION_GET_PAGE (not on top-level allowlist)', () => {
  assert.equal(canInvokeAction('builder', 'NOTION_GET_PAGE'), false);
});

// --- canInvokeAction (Gmail — planned) ---

test('master can invoke GMAIL_SEND_EMAIL', () => {
  assert.equal(canInvokeAction('master', 'GMAIL_SEND_EMAIL'), true);
});

test('scout cannot invoke GMAIL_SEND_EMAIL (write action)', () => {
  assert.equal(canInvokeAction('scout', 'GMAIL_SEND_EMAIL'), false);
});

test('scout can invoke GMAIL_FETCH_EMAILS (read action)', () => {
  assert.equal(canInvokeAction('scout', 'GMAIL_FETCH_EMAILS'), true);
});

test('builder cannot invoke any action (not on top-level allowlist)', () => {
  assert.equal(canInvokeAction('builder', 'GMAIL_FETCH_EMAILS'), false);
});

test('undeclared action is denied to all roles', () => {
  assert.equal(canInvokeAction('master', 'UNKNOWN_ACTION_XYZ'), false);
});

// --- actionRequiresApproval ---

test('NOTION_CREATE_PAGE requires approval', () => {
  assert.equal(actionRequiresApproval('NOTION_CREATE_PAGE'), true);
});

test('NOTION_UPDATE_PAGE requires approval', () => {
  assert.equal(actionRequiresApproval('NOTION_UPDATE_PAGE'), true);
});

test('NOTION_GET_PAGE does not require approval', () => {
  assert.equal(actionRequiresApproval('NOTION_GET_PAGE'), false);
});

test('NOTION_SEARCH does not require approval', () => {
  assert.equal(actionRequiresApproval('NOTION_SEARCH'), false);
});

test('GMAIL_SEND_EMAIL requires approval', () => {
  assert.equal(actionRequiresApproval('GMAIL_SEND_EMAIL'), true);
});

test('GMAIL_FETCH_EMAILS does not require approval', () => {
  assert.equal(actionRequiresApproval('GMAIL_FETCH_EMAILS'), false);
});

test('undeclared action defaults to requiring approval (safe default)', () => {
  assert.equal(actionRequiresApproval('UNKNOWN_ACTION_XYZ'), true);
});

// --- getActionPolicy ---

test('getActionPolicy returns policy for NOTION_GET_PAGE', () => {
  const policy = getActionPolicy('NOTION_GET_PAGE');
  assert.ok(policy);
  assert.equal(policy.provider, 'notion');
  assert.equal(policy.requiresApproval, false);
});

test('getActionPolicy returns policy for NOTION_CREATE_PAGE', () => {
  const policy = getActionPolicy('NOTION_CREATE_PAGE');
  assert.ok(policy);
  assert.equal(policy.provider, 'notion');
  assert.equal(policy.requiresApproval, true);
});

test('getActionPolicy returns policy for known action', () => {
  const policy = getActionPolicy('GOOGLECALENDAR_CREATE_EVENT');
  assert.ok(policy);
  assert.equal(policy.provider, 'googlecalendar');
  assert.equal(policy.requiresApproval, true);
});

test('getActionPolicy returns undefined for unknown action', () => {
  assert.equal(getActionPolicy('DOES_NOT_EXIST'), undefined);
});

// --- Allowlist set integrity ---

test('COMPOSIO_ALLOWED_ROLES contains exactly master, senior, scout', () => {
  assert.deepEqual(
    [...COMPOSIO_ALLOWED_ROLES].sort(),
    ['master', 'scout', 'senior'],
  );
});
