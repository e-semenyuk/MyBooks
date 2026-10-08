'use client'

import { useCallback, useEffect, useState } from 'react'

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

function keyToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

export default function NotificationSettings({ showToast }: Props) {
  const [locale, setLocale] = useState('en')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [me, key] = await Promise.all([fetch('/api/account/me'), fetch('/api/push/public-key')])
      if (me.ok) {
        const data = await me.json()
        setLocale(data.locale)
        setPushEnabled(data.pushEnabled)
      }
      if (key.ok) setPublicKey((await key.json()).publicKey)
    } catch {
      showToast('Failed to load notification settings', 'error')
    }
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const changeLocale = async (value: string) => {
    setLocale(value)
    const response = await fetch('/api/account/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: value }),
    })
    showToast(response.ok ? 'Language saved' : 'Failed to save language', response.ok ? 'success' : 'error')
  }

  const enable = async () => {
    setBusy(true)
    try {
      if (!publicKey) throw new Error('Push notifications are not available on this server')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Notifications are blocked in this browser')
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(publicKey),
        }))
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!response.ok) throw new Error('Could not save the subscription')
      setPushEnabled(true)
      showToast('Push notifications enabled', 'success')
    } catch (error: any) {
      showToast(error?.message ?? 'Could not enable push notifications', 'error')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await registration?.pushManager.getSubscription()
      const endpoint = subscription?.endpoint
      await subscription?.unsubscribe()
      if (endpoint) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      setPushEnabled(false)
      showToast('Push notifications disabled', 'success')
    } catch {
      showToast('Could not disable push notifications', 'error')
    } finally {
      setBusy(false)
    }
  }

  let status = 'Push notifications are off.'
  if (!supported) status = 'This browser does not support push notifications.'
  else if (!publicKey) status = 'Push notifications are not set up on this server.'
  else if (pushEnabled) status = 'Push notifications are on for this account.'

  return (
    <section data-testid="notification-settings" className="mb-14">
      <div className="border-t-2 border-ink-950 pb-5 pt-5">
        <h3 className="font-display text-2xl font-bold tracking-tight text-ink-950">Notifications</h3>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label htmlFor="notification-locale" className="label">Language</label>
          <select
            id="notification-locale"
            data-testid="notification-locale-select"
            className="input"
            value={locale}
            onChange={(e) => changeLocale(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-ink-600">Order emails and push messages use this language.</p>
        </div>
        <div>
          <p className="label">Push</p>
          <p data-testid="push-status" className="mb-3 text-sm text-ink-700">{status}</p>
          {supported && publicKey && (
            pushEnabled ? (
              <button type="button" data-testid="push-disable-button" className="btn btn-outline" disabled={busy} onClick={disable}>
                Turn off push
              </button>
            ) : (
              <button type="button" data-testid="push-enable-button" className="btn btn-primary" disabled={busy} onClick={enable}>
                Turn on push
              </button>
            )
          )}
        </div>
      </div>
    </section>
  )
}
