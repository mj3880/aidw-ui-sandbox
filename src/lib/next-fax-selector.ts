import type { FaxRequest } from '@/types/request';

export interface CurrentUser {
  userId: string;
  teamId: string;
}

/**
 * Filter FaxRequests visible to the current user (assignee scope).
 * Visible = assigned directly to userId, OR assigned to user's team.
 */
export function filterByAssigneeScope(
  requests: FaxRequest[],
  user: CurrentUser,
): FaxRequest[] {
  return requests.filter(
    (r) => r.assigneeName === user.userId || r.assigneeTeamId === user.teamId,
  );
}

/**
 * Pick the next pending FAX request for the current user.
 * Returns the oldest (by receivedAt asc) pending request in the user's assignee scope.
 */
export function selectNextPendingFax(
  requests: FaxRequest[],
  user: CurrentUser,
): FaxRequest | null {
  const scoped = filterByAssigneeScope(requests, user).filter((r) => r.status === 'pending');
  if (scoped.length === 0) return null;
  scoped.sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : 1));
  return scoped[0];
}

/**
 * Pick top N pending requests in user's scope, sorted by receivedAt desc (newest first).
 */
export function selectPendingTopN(
  requests: FaxRequest[],
  user: CurrentUser,
  n = 10,
): FaxRequest[] {
  const scoped = filterByAssigneeScope(requests, user).filter((r) => r.status === 'pending');
  scoped.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  return scoped.slice(0, n);
}
