// Dummy data for the sample app. Nothing here comes from a real system.
// The mock API in ./api.ts serves these collections (and mutates them in memory)
// so every screen can be explored without a backend. Reloading resets the data.

const DAY = 86_400_000

/** ISO timestamp `n` days from now (negative = in the past). */
const iso = (n, hour = 9) => {
  const d = new Date(Date.now() + n * DAY)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

/** Plain `YYYY-MM-DD` date `n` days from now. */
const ymd = (n) => iso(n).slice(0, 10)

// ---------------------------------------------------------------- reference data

export const permissions = ['users.manage', 'users.view-all', 'roles.manage', 'positions.manage'].map((name, i) => ({
  id: i + 1,
  name,
}))

export const roles = [
  { id: 1, name: 'Administrator', permissions: [] },
  { id: 2, name: 'Manager', permissions: permissions.filter((p) => p.name === 'users.view-all') },
  { id: 3, name: 'Employee', permissions: [] },
]

export const positions = [
  { id: 1, name: 'Director', code: 'DIR' },
  { id: 2, name: 'Manager', code: 'MGR' },
  { id: 3, name: 'Senior Specialist', code: 'SSP' },
  { id: 4, name: 'Specialist', code: 'SPC' },
  { id: 5, name: 'Coordinator', code: 'CRD' },
]

const userSeed = [
  [1, 'Alex Morgan', 'admin@example.com', 1, 'E-1001', 1, '2019-03-01'],
  [2, 'Priya Nair', 'priya.nair@example.com', 2, 'E-1002', 2, '2020-06-15'],
  [3, 'Daniel Brooks', 'daniel.brooks@example.com', 2, 'E-1003', 2, '2018-09-10'],
  [4, 'Sara Haddad', 'sara.haddad@example.com', 3, 'E-1004', 3, '2021-01-20'],
  [5, 'Liam Carter', 'liam.carter@example.com', 3, 'E-1005', 3, '2022-02-07'],
  [6, 'Mei Tanaka', 'mei.tanaka@example.com', 4, 'E-1006', 3, '2023-05-02'],
  [7, 'Omar Khalil', 'omar.khalil@example.com', 4, 'E-1007', 3, '2022-11-14'],
  [8, 'Julia Weber', 'julia.weber@example.com', 4, 'E-1008', 3, '2024-04-22'],
]

export const users = userSeed.map(([id, name, email, position_id, employee_code, roleId, hire_date]) => {
  const role = roles.find((r) => r.id === roleId)
  return {
    id,
    name,
    email,
    position_id,
    employee_code,
    status: id === 8 ? 'inactive' : 'active',
    phone: `+971 50 123 ${String(4000 + id)}`,
    hire_date,
    avatar_url: null,
    position: positions.find((p) => p.id === position_id),
    roles: [role],
    permissions: role.permissions.map((p) => p.name),
  }
})

// Credentials for the demo login (any listed user, password below).
export const DEMO_PASSWORD = 'password'

// ---------------------------------------------------------------- tickets

const user = (id) => users.find((u) => u.id === id)

const requestAbilities = { assign: true, reject: true, update_status: true, cancel: true }

const requestSeed = [
  [1, 'Q4 product launch campaign', 'Campaign', 'processing', 3, [2], 5],
  [2, 'New laptops for onboarding batch', 'General', 'pending', 4, [8], 10],
  [3, 'Annual customer summit', 'Event', 'processing', 2, [2, 6], 30],
  [4, 'Update expense policy PDF', 'General', 'resolved', 5, [4], -2],
  [5, 'VPN access for contractors', 'General', 'pending', 7, [1], 3],
  [6, 'Brand guideline refresh', 'Campaign', 'resolved', 6, [2], -10],
  [7, 'Office badge replacement', 'General', 'rejected', 5, [], 7],
  [8, 'Regional sales kickoff', 'Event', 'cancelled', 3, [3], 21],
]

export const requests = requestSeed.map(([id, title, type, workflow_status, createdBy, assigneeIds, due]) => ({
  id,
  request_number: `REQ-2026-${String(id).padStart(5, '0')}`,
  created_by: createdBy,
  title,
  description: `Sample description for “${title}”. Replace with your own content.`,
  type,
  type_details:
    type === 'Campaign'
      ? {
          project: title,
          objective: 'Increase awareness among existing customers.',
          target_audience: 'Small and mid-size business owners',
          core_message: 'Simple tools that save time.',
          deliverables: 'Landing page, 3 emails, social posts',
          channels: 'Email, LinkedIn',
          tone: 'Friendly and confident',
          timeline: '6 weeks',
        }
      : null,
  due_date: ymd(due),
  workflow_status,
  rejection_reason: workflow_status === 'rejected' ? 'Duplicate of an existing ticket.' : null,
  resolved_at: workflow_status === 'resolved' ? iso(-3) : null,
  created_at: iso(-id * 3),
  creator: user(createdBy),
  assignees: assigneeIds.map(user),
  activities: [
    { id: 1, event: 'created', description: 'Ticket created', properties: {}, created_at: iso(-id * 3), causer: user(createdBy) },
    ...(assigneeIds.length
      ? [{ id: 2, event: 'assigned', description: `Assigned to ${user(assigneeIds[0]).name}`, properties: {}, created_at: iso(-id * 3 + 1), causer: user(1) }]
      : []),
  ],
  attachments: [],
  comments: [
    { id: 1, body: 'Thanks — we will pick this up this week.', created_at: iso(-id * 3 + 1, 11), user: user(assigneeIds[0] ?? 1) },
  ],
  can: requestAbilities,
}))

// ---------------------------------------------------------------- notifications & views

export const notifications = [
  {
    id: 'n1',
    data: { title: 'Ticket assigned', message: 'You were assigned to “Q4 product launch campaign”.', action_url: '/requests/1', module: 'requests', module_id: 1 },
    read_at: null,
    created_at: iso(0, 8),
  },
  {
    id: 'n2',
    data: { title: 'Ticket resolved', message: '“Update expense policy PDF” was marked resolved.', action_url: '/requests/4', module: 'requests', module_id: 4 },
    read_at: iso(-2),
    created_at: iso(-2, 10),
  },
]

export const savedViews = []
