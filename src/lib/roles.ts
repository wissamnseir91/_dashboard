// Kept in sync with RoleController::PROTECTED_NAMES on the backend — the
// backend is the real enforcement, this only drives which UI affordances
// (rename input, delete button) are shown.
export const PROTECTED_ROLE_NAMES = ['Administrator', 'Employee', 'Finance', 'Finance Reviewer']
