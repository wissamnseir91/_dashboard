import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField, FormPage } from '@/components/FormPage'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateRequest } from '@/hooks/useRequests'
import { CAMPAIGN_FIELDS } from '@/lib/campaign'
import { errorMessage } from '@/lib/errors'
import type { CampaignBriefDetails, RequestType } from '@/types'

const REQUEST_TYPES: RequestType[] = ['General', 'Campaign', 'Event']

export default function NewRequest() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<RequestType>('General')
  const [dueDate, setDueDate] = useState('')
  const [campaignDetails, setCampaignDetails] = useState<CampaignBriefDetails>({})
  const createRequest = useCreateRequest()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    createRequest.mutate(
      {
        title,
        description: description || undefined,
        type,
        due_date: dueDate || undefined,
        type_details: type === 'Campaign' ? campaignDetails : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Ticket created')
          navigate('/requests')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <FormPage
      title="New Ticket"
      description="Describe what you need."
      backTo="/requests"
      backLabel="Back to Tickets"
      submitLabel={createRequest.isPending ? 'Creating…' : 'Create Ticket'}
      submitDisabled={!title || createRequest.isPending}
      onSubmit={handleSubmit}
    >
      <FormField label="Type" htmlFor="type">
        <Select value={type} onValueChange={(v) => setType(v as RequestType)}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Title" htmlFor="title">
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormField>

      <FormField label="Description" htmlFor="description">
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>

      <FormField label="Due Date" htmlFor="due_date">
        <Input id="due_date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </FormField>

      {type === 'Campaign' && (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-sm font-medium">Campaign Brief</p>
          {CAMPAIGN_FIELDS.map(({ key, label, placeholder, multiline }) => (
            <FormField key={key} label={label} htmlFor={`campaign_${key}`}>
              {multiline ? (
                <Textarea
                  id={`campaign_${key}`}
                  placeholder={placeholder}
                  value={campaignDetails[key] ?? ''}
                  onChange={(e) => setCampaignDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              ) : (
                <Input
                  id={`campaign_${key}`}
                  placeholder={placeholder}
                  value={campaignDetails[key] ?? ''}
                  onChange={(e) => setCampaignDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              )}
            </FormField>
          ))}
        </div>
      )}
    </FormPage>
  )
}
