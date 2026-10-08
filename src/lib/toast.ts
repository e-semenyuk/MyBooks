import { toast } from 'sonner'

const base = {
  duration: 3000,
  style: {
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
  },
}

export function showToast(message: string, type: 'success' | 'error') {
  const background = type === 'success' ? '#10b981' : '#ef4444'
  const options = { ...base, style: { ...base.style, background } }
  if (type === 'success') toast.success(message, options)
  else toast.error(message, options)
}

export type ShowToast = typeof showToast
