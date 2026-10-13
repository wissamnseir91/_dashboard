import { isAxiosError } from 'axios'

export function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.errors) {
      return Object.values(data.errors).flat().join(' ')
    }
    if (data?.message) {
      return data.message
    }
  }
  return 'Something went wrong. Please try again.'
}

// Raw per-field validation errors from a 422 response — lets a form show a
// message next to the specific field that failed (e.g. "lpo") instead of
// only a flattened toast.
export function fieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (isAxiosError(error)) {
    return (error.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors
  }
  return undefined
}
