import type { CampaignBriefDetails } from '@/types'

export interface CampaignField {
  key: keyof CampaignBriefDetails
  label: string
  placeholder: string
  multiline?: boolean
}

export const CAMPAIGN_FIELDS: CampaignField[] = [
  { key: 'project', label: 'Project', placeholder: 'What are we creating?' },
  { key: 'objective', label: 'Objective', placeholder: 'What do we want to achieve?', multiline: true },
  { key: 'target_audience', label: 'Target Audience', placeholder: 'Who are we talking to?', multiline: true },
  { key: 'core_message', label: 'Core Message', placeholder: 'What is the one thing we want to say?', multiline: true },
  { key: 'deliverables', label: 'Deliverables', placeholder: 'What do we need to produce?', multiline: true },
  { key: 'channels', label: 'Channels', placeholder: 'Where will it be used?' },
  { key: 'tone', label: 'Tone', placeholder: 'How should it feel/sound?' },
  { key: 'timeline', label: 'Timeline', placeholder: 'When is it due?' },
]
