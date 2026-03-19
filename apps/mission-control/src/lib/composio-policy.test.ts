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

// --- canInvokeAction ---

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
