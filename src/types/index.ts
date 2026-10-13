export interface Permission {
  id: number
  name: string
}

export interface Role {
  id: number
  name: string
  permissions?: Permission[]
}

export interface Position {
  id: number
  name: string
  code: string
}

export interface User {
  id: number
  name: string
  email: string
  position_id: number
  employee_code: string | null
  status: 'active' | 'inactive'
  phone: string | null
  hire_date: string | null
  avatar_url: string | null
  position?: Position | null
  roles?: Role[]
  permissions?: string[]
}


export type RequestStatus = 'pending' | 'processing' | 'resolved' | 'rejected' | 'cancelled'

export type RequestType = 'General' | 'Campaign' | 'Event'

export interface CampaignBriefDetails {
  project?: string
  objective?: string
  target_audience?: string
  core_message?: string
  deliverables?: string
  channels?: string
  tone?: string
  timeline?: string
}

export interface Attachment {
  id: number
  original_filename: string
  mime_type: string
  size: number
  created_at: string
  uploader?: User
  can_delete?: boolean
  /** The comment this file was posted alongside, if any — null for a file attached with no message. */
  comment_id: number | null
}

export interface RequestActivityEntry {
  id: number
  event: string | null
  description: string
  properties: Record<string, unknown>
  created_at: string
  causer?: User | null
}

export interface RequestComment {
  id: number
  body: string
  created_at: string
  user?: User
}

export interface RequestAbilities {
  assign: boolean
  reject: boolean
  update_status: boolean
  cancel: boolean
}

export interface ServiceRequest {
  id: number
  request_number: string
  created_by: number
  title: string
  description: string | null
  type: RequestType
  type_details: CampaignBriefDetails | null
  due_date: string | null
  workflow_status: RequestStatus
  rejection_reason: string | null
  resolved_at: string | null
  created_at: string
  creator?: User
  assignees?: User[]
  activities?: RequestActivityEntry[]
  attachments?: Attachment[]
  comments?: RequestComment[]
  can?: RequestAbilities
}

export interface AppNotification {
  id: string
  data: {
    title: string
    message: string
    action_url: string
    module: string
    module_id: number
  }
  read_at: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export type SavedViewModule = 'requests' | 'users'

export interface SavedView {
  id: number
  user_id: number
  module: SavedViewModule
  name: string
  filters: Record<string, string> | null
  sort: string | null
  position: number
  created_at: string
  updated_at: string
}
