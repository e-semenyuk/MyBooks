import { toast } from 'sonner'

// Colours and shape come from globals.css so every toast looks the same.
export function showToast(message: string, type: 'success' | 'error') {
  if (type === 'success') toast.success(message, { duration: 3000 })
  else toast.error(message, { duration: 4000 })
}

export type ShowToast = typeof showToast
