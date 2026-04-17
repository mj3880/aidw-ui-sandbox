/**
 * Logged-in user identity used for assignee scoping across the app.
 */
export interface CurrentUser {
  userId: string;
  teamId: string;
}
