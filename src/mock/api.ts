/* eslint-disable @typescript-eslint/no-explicit-any */
// In-memory stand-in for the REST API. It's installed as the axios adapter in
// `src/lib/api.ts`, so every hook keeps calling `api.get(...)` / `api.post(...)`
// exactly as it would against a real backend — only the transport changes.
// Data lives in ./data.js and resets on page reload.
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import * as seed from './data.js'

type Row = Record<string, any>
type Ctx = { params: Record<string, string>; query: Row; body: Row; config: InternalAxiosRequestConfig; me: Row }
type Handler = (ctx: Ctx) => unknown

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const now = () => new Date().toISOString()
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const db = {
  users: clone(seed.users) as Row[],
  positions: clone(seed.positions) as Row[],
  roles: clone(seed.roles) as Row[],
  requests: clone(seed.requests) as Row[],
  notifications: clone(seed.notifications) as Row[],
  savedViews: clone(seed.savedViews) as Row[],
}

const nextId = (rows: Row[]) => rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1
const byId = (rows: Row[], id: string | number) => rows.find((r) => String(r.id) === String(id))
const userById = (id: number) => db.users.find((u) => u.id === id)

function fail(status: number, message: string, config: InternalAxiosRequestConfig): never {
  const response = { data: { message }, status, statusText: message, headers: {}, config }
  throw new AxiosError(message, String(status), config, null, response)
}

/** axios hands the adapter a JSON string or a FormData — normalise both to a plain object. */
function readBody(config: InternalAxiosRequestConfig): Row {
  const raw = config.data
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  if (raw instanceof FormData) {
    const out: Row = { files: [] as File[] }
    raw.forEach((value, key) => {
      if (value instanceof File) out.files.push(value)
      else out[key.replace(/\[\]$/, '')] = value
    })
    return out
  }
  return raw
}

// ------------------------------------------------------------ list helpers

function paginate(rows: Row[], query: Row) {
  const perPage = Number(query.per_page) || 15
  const page = Number(query.page) || 1
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage))
  return {
    data: rows.slice((page - 1) * perPage, page * perPage),
    total: rows.length,
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
  }
}

/** Exact-match filters on any top-level field, plus a free-text `search`. */
function applyFilters(rows: Row[], query: Row, special: Record<string, (row: Row, value: string) => boolean> = {}) {
  const filters: Row = query.filter ?? {}
  return rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      const v = String(value)
      if (key === 'search') return JSON.stringify(row).toLowerCase().includes(v.toLowerCase())
      if (special[key]) return special[key](row, v)
      if (key in row) return String(row[key]) === v
      return true // unknown filter (date ranges etc.) — ignored in the demo
    }),
  )
}

function applySort(rows: Row[], sort?: string) {
  if (!sort) return rows
  const desc = sort.startsWith('-')
  const field = sort.replace(/^-/, '')
  return [...rows].sort((a, b) => {
    const x = a[field]
    const y = b[field]
    if (x === y) return 0
    if (x == null) return 1
    if (y == null) return -1
    return (x > y ? 1 : -1) * (desc ? -1 : 1)
  })
}

const listOf = (rows: Row[], query: Row, special?: Parameters<typeof applyFilters>[2]) =>
  paginate(applySort(applyFilters(rows, query, special), query.sort), query)

// ------------------------------------------------------------ shared behaviours

function attachFiles(files: File[] = [], uploader: Row, commentId: number | null = null) {
  return files.map((file, i) => ({
    id: Date.now() + i,
    original_filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size,
    created_at: now(),
    uploader,
    can_delete: true,
    comment_id: commentId,
  }))
}

function purge(rows: Row[], ids: number[]) {
  for (let i = rows.length - 1; i >= 0; i--) if (ids.includes(rows[i].id)) rows.splice(i, 1)
}

function log(row: Row, description: string, me: Row) {
  row.activities = [...(row.activities ?? []), { id: Date.now(), event: null, description, properties: {}, created_at: now(), causer: me }]
}

/** Generic CRUD routes for the small lookup tables (positions, roles). */
function crud(path: string, rows: () => Row[], hydrate: (payload: Row, row?: Row) => Row = (p) => p): [string, string, Handler][] {
  return [
    ['get', path, () => rows()],
    ['post', path, ({ body }) => {
      const row = { id: nextId(rows()), ...hydrate(body) }
      rows().push(row)
      return row
    }],
    ['patch', `${path}/:id`, ({ params, body }) => Object.assign(byId(rows(), params.id)!, hydrate(body, byId(rows(), params.id)))],
    ['delete', `${path}/:id`, ({ params }) => {
      purge(rows(), [Number(params.id)])
      return null
    }],
  ]
}

const slim = (u: Row) => ({
  id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url,
  position_id: u.position_id, employee_code: u.employee_code, status: u.status, phone: u.phone, hire_date: u.hire_date,
})
const pickUsers = (ids: number[] = []) => ids.map((id) => userById(Number(id))).filter(Boolean).map((u) => slim(u!))

function hydrateUser(payload: Row, existing?: Row): Row {
  const out: Row = { ...payload }
  delete out.role
  if (payload.position_id) out.position = db.positions.find((p) => p.id === Number(payload.position_id))
  if (payload.role) {
    const role = db.roles.find((r) => r.name === payload.role)
    if (role) {
      out.roles = [role]
      out.permissions = role.permissions.map((p: Row) => p.name)
    }
  }
  return { avatar_url: null, status: 'active', phone: null, ...existing, ...out }
}

// ------------------------------------------------------------ route table

const ids = (body: Row): number[] => body.ids ?? []
const blob = (text: string, type = 'text/plain') => new Blob([text], { type })

const routes: [string, string, Handler][] = [
  // ---- auth
  ['post', '/auth/login', ({ body, config }) => {
    const found = db.users.find((u) => u.email.toLowerCase() === String(body.email).toLowerCase())
    if (!found || body.password !== seed.DEMO_PASSWORD) fail(422, 'These credentials do not match our records.', config)
    if (found.status !== 'active') fail(422, 'This account is inactive.', config)
    return { user: found, token: `demo-token-${found.id}` }
  }],
  ['post', '/auth/verify-otp', ({ config }) => fail(422, 'OTP is not used in the demo.', config)],
  ['post', '/auth/logout', () => ({ message: 'Logged out' })],
  ['post', '/auth/forgot-password', () => ({ message: 'If that address exists, a reset link has been sent (demo: nothing was sent).' })],
  ['post', '/auth/reset-password', () => ({ message: 'Password reset (demo: nothing changed).' })],

  // ---- profile
  ['put', '/profile', ({ body, me }) => Object.assign(me, body)],
  ['post', '/profile/avatar', ({ body, me }) => {
    const file = body.files?.[0] ?? body.avatar
    if (file instanceof File) me.avatar_url = URL.createObjectURL(file)
    return me
  }],
  ['delete', '/profile/avatar', ({ me }) => Object.assign(me, { avatar_url: null })],
  ['put', '/profile/password', () => ({ message: 'Password updated (demo: nothing changed).' })],

  // ---- notifications
  ['get', '/notifications', ({ query }) => paginate(db.notifications, query)],
  ['patch', '/notifications/:id/read', ({ params }) => {
    const n = byId(db.notifications, params.id)
    if (n) n.read_at = now()
    return null
  }],

  // ---- users
  ['get', '/users', ({ query }) => {
    const rows = applyFilters(db.users, query, {
      role: (u, v) => u.roles.some((r: Row) => r.name === v),
    })
    return query.page ? paginate(applySort(rows, query.sort), query) : db.users
  }],
  ['get', '/users/:id', ({ params, config }) => byId(db.users, params.id) ?? fail(404, 'User not found.', config)],
  ['post', '/users', ({ body }) => {
    const row = hydrateUser({ id: nextId(db.users), ...body })
    db.users.push(row)
    return row
  }],
  ['patch', '/users/:id', ({ params, body }) => Object.assign(byId(db.users, params.id)!, hydrateUser(body, byId(db.users, params.id)))],

  // ---- lookup tables
  ...crud('/positions', () => db.positions),
  ...crud('/roles', () => db.roles, (p) => ({
    name: p.name,
    permissions: (p.permissions ?? []).map((name: string) => seed.permissions.find((x) => x.name === name)).filter(Boolean),
  })),
  ['get', '/permissions', () => seed.permissions],

  // ---- requests
  ['get', '/requests', ({ query }) => listOf(db.requests, query, {
    assigned_to: (r, v) => r.assignees.some((a: Row) => String(a.id) === v),
  })],
  ['delete', '/requests', ({ body }) => purge(db.requests, ids(body))],
  ['post', '/requests', ({ body, me }) => {
    const id = nextId(db.requests)
    const row = {
      id, request_number: `REQ-2026-${String(id).padStart(5, '0')}`, created_by: me.id, creator: me, type: 'General',
      type_details: null, description: null, due_date: null, workflow_status: 'pending', rejection_reason: null, resolved_at: null,
      created_at: now(), assignees: [], attachments: [], comments: [],
      can: { assign: true, reject: true, update_status: true, cancel: true },
      activities: [{ id: 1, event: 'created', description: 'Ticket created', properties: {}, created_at: now(), causer: me }],
      ...body,
    }
    db.requests.push(row)
    return row
  }],
  ['get', '/requests/:id/mentionable-users', () => db.users.map((u) => ({ id: u.id, name: u.name }))],
  ['get', '/requests/:id/attachments/:aid/download', () => blob('Sample attachment (demo).')],
  ['delete', '/requests/:id/attachments/:aid', ({ params }) => {
    const r = byId(db.requests, params.id)!
    r.attachments = r.attachments.filter((a: Row) => String(a.id) !== params.aid)
    return null
  }],
  ['post', '/requests/:id/comments', ({ params, body, me }) => {
    const r = byId(db.requests, params.id)!
    const comment = { id: Date.now(), body: body.body ?? '', created_at: now(), user: me }
    if (comment.body) r.comments.push(comment)
    r.attachments.push(...attachFiles(body.files, me, comment.body ? comment.id : null))
    return comment
  }],
  ['patch', '/requests/:id/:action', ({ params, body, me }) => {
    const r = byId(db.requests, params.id)!
    if (params.action === 'assign') {
      r.assignees = pickUsers(body.user_ids)
      if (r.workflow_status === 'pending') r.workflow_status = 'processing'
    } else if (params.action === 'reject') {
      Object.assign(r, { workflow_status: 'rejected', rejection_reason: body.reason })
    } else if (params.action === 'cancel') {
      r.workflow_status = 'cancelled'
    } else if (params.action === 'status') {
      Object.assign(r, { workflow_status: body.status, resolved_at: body.status === 'resolved' ? now() : null })
    }
    log(r, `Ticket ${params.action}`, me)
    return r
  }],
  ['get', '/requests/:id', ({ params, config }) => byId(db.requests, params.id) ?? fail(404, 'Ticket not found.', config)],

  // ---- saved views
  ['get', '/saved-views', ({ query }) => db.savedViews.filter((v) => v.module === query.module)],
  ['post', '/saved-views', ({ body, me }) => {
    const row = {
      id: nextId(db.savedViews), user_id: me.id, filters: null, sort: null,
      position: db.savedViews.filter((v) => v.module === body.module).length, created_at: now(), updated_at: now(), ...body,
    }
    db.savedViews.push(row)
    return row
  }],
  ['post', '/saved-views/reorder', ({ body }) => {
    ;(body.ordered_ids as number[]).forEach((id, position) => Object.assign(byId(db.savedViews, id) ?? {}, { position }))
    return null
  }],
  ['patch', '/saved-views/:id', ({ params, body }) => Object.assign(byId(db.savedViews, params.id)!, body, { updated_at: now() })],
  ['delete', '/saved-views/:id', ({ params }) => purge(db.savedViews, [Number(params.id)])],

]

// ------------------------------------------------------------ matching

const compiled = routes.map(([method, path, handler]) => ({
  method,
  handler,
  regex: new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`),
}))

export const mockAdapter: AxiosAdapter = async (config) => {
  await delay(120)

  const method = (config.method ?? 'get').toLowerCase()
  const path = (config.url ?? '').split('?')[0].replace(/\/+$/, '') || '/'

  for (const route of compiled) {
    if (route.method !== method) continue
    const match = route.regex.exec(path)
    if (!match) continue

    const token = String(config.headers?.get?.('Authorization') ?? '')
    const me = userById(Number(token.replace('Bearer demo-token-', ''))) ?? db.users[0]
    const result = route.handler({ params: match.groups ?? {}, query: config.params ?? {}, body: readBody(config), config, me })
    const data = result instanceof Blob ? result : result === undefined ? null : clone(result)
    return { data, status: data === null ? 204 : 200, statusText: 'OK', headers: {}, config, request: {} }
  }

  return fail(404, `Demo API: no mock for ${method.toUpperCase()} ${path}`, config)
}
