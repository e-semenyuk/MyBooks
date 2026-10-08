'use client'

import { useCallback, useEffect, useState } from 'react'
import { EditIcon, PlusIcon, TrashIcon } from '@/components/icons'

export interface SavedAddress {
  id: number
  label: string
  fullName: string
  street: string
  city: string
  postalCode: string
  country: string
}

interface AddressBookProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

const emptyForm = { label: '', fullName: '', street: '', city: '', postalCode: '', country: '' }

export default function AddressBook({ showToast }: AddressBookProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/addresses')
      if (response.ok) setAddresses(await response.json())
    } catch {
      showToast('Failed to load addresses', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const startNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const startEdit = (address: SavedAddress) => {
    setEditingId(address.id)
    setForm({
      label: address.label,
      fullName: address.fullName,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country,
    })
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(editingId ? `/api/addresses/${editingId}` : '/api/addresses', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (response.ok) {
        showToast(editingId ? 'Address updated successfully' : 'Address saved successfully', 'success')
        close()
        load()
      } else {
        const error = await response.json().catch(() => null)
        showToast(error?.error || 'Failed to save address', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    if (response.ok) {
      showToast('Address deleted successfully', 'success')
      load()
    } else {
      showToast('Failed to delete address', 'error')
    }
  }

  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <section data-testid="addresses-section" className="mb-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-ink-950 pb-5 pt-5">
        <h3 className="font-display text-2xl font-bold tracking-tight text-ink-950">Saved addresses</h3>
        {!open && (
          <button data-testid="address-add-button" onClick={startNew} className="btn btn-secondary btn-sm">
            <PlusIcon className="h-4 w-4" />
            Add address
          </button>
        )}
      </div>

      {open && (
        <form
          data-testid="address-form"
          onSubmit={save}
          className="mb-8 grid gap-4 border-2 border-ink-950 p-6 sm:grid-cols-2"
        >
          <div>
            <label htmlFor="addr-label" className="label">Label</label>
            <input id="addr-label" data-testid="address-label-input" value={form.label} onChange={set('label')} maxLength={30} className="input" placeholder="Home, Office" />
          </div>
          <div>
            <label htmlFor="addr-name" className="label">Full name *</label>
            <input id="addr-name" data-testid="address-fullname-input" value={form.fullName} onChange={set('fullName')} required maxLength={100} autoComplete="name" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="addr-street" className="label">Street *</label>
            <input id="addr-street" data-testid="address-street-input" value={form.street} onChange={set('street')} required maxLength={200} autoComplete="address-line1" className="input" />
          </div>
          <div>
            <label htmlFor="addr-city" className="label">City *</label>
            <input id="addr-city" data-testid="address-city-input" value={form.city} onChange={set('city')} required maxLength={100} autoComplete="address-level2" className="input" />
          </div>
          <div>
            <label htmlFor="addr-postal" className="label">Postal code *</label>
            <input id="addr-postal" data-testid="address-postal-input" value={form.postalCode} onChange={set('postalCode')} required maxLength={20} autoComplete="postal-code" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="addr-country" className="label">Country *</label>
            <input id="addr-country" data-testid="address-country-input" value={form.country} onChange={set('country')} required maxLength={60} autoComplete="country-name" className="input" />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button data-testid="address-save-button" type="submit" disabled={saving} className="btn btn-primary">
              {editingId ? 'Update address' : 'Save address'}
            </button>
            <button data-testid="address-cancel-button" type="button" onClick={close} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div aria-busy="true" className="skeleton h-24 w-full" />
      ) : addresses.length === 0 ? (
        !open && (
          <p data-testid="addresses-empty" className="border-t border-mist-200 py-8 text-ink-600">
            No saved addresses yet. Add one to fill in checkout faster.
          </p>
        )
      ) : (
        <div data-testid="addresses-list" className="grid gap-px border border-mist-200 bg-mist-200 sm:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.id} data-testid={`address-item-${address.id}`} className="flex justify-between gap-4 bg-white p-5">
              <div className="min-w-0">
                {address.label && <p className="section-label mb-2">{address.label}</p>}
                <p className="font-semibold text-ink-950">{address.fullName}</p>
                <p className="text-sm text-ink-600">{address.street}</p>
                <p className="text-sm text-ink-600">
                  {address.postalCode} {address.city}
                </p>
                <p className="text-sm text-ink-600">{address.country}</p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button
                  data-testid={`address-edit-${address.id}`}
                  onClick={() => startEdit(address)}
                  aria-label={`Edit address ${address.label || address.street}`}
                  className="p-2 text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                >
                  <EditIcon className="h-5 w-5" />
                </button>
                <button
                  data-testid={`address-delete-${address.id}`}
                  onClick={() => remove(address.id)}
                  aria-label={`Delete address ${address.label || address.street}`}
                  className="p-2 text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
