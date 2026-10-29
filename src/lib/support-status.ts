/** Every status a support post can have, in menu order. */
export const SUPPORT_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CLOSED", "DUPLICATE"];

/** The statuses a post's author may set; the rest are for admins. */
export const AUTHOR_STATUSES = ["OPEN", "CLOSED"];

/** The statuses a user may pick for a post: all for an admin, else the author's. */
export function statusChoices(isAdmin: boolean): string[] {
  return isAdmin ? SUPPORT_STATUSES : AUTHOR_STATUSES;
}
