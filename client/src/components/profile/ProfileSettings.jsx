import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

export default function ProfileSettings({ title, description }) {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: '', newPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const payload = { name: form.name, email: form.email }
      if (form.newPassword) Object.assign(payload, { currentPassword: form.currentPassword, newPassword: form.newPassword })
      const data = await authService.updateProfile(payload)
      updateUser(data.user); setForm(current => ({ ...current, currentPassword: '', newPassword: '' })); setMessage('Profile saved.')
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return <section className="profile-page"><span className="eyebrow">{user.role} profile</span><h1>{title}</h1><p className="lead">{description}</p><form className="profile-form" onSubmit={submit}><div className="profile-card"><h2>Account details</h2><label>Display name<input name="name" value={form.name} onChange={update} required minLength="2" /></label><label>Email address<input name="email" type="email" value={form.email} onChange={update} required /></label><p className="profile-role">Role: <strong>{user.role}</strong></p></div><div className="profile-card"><h2>Change password</h2><p>Leave these fields blank to keep your existing password.</p><label>Current password<input name="currentPassword" type="password" value={form.currentPassword} onChange={update} autoComplete="current-password" /></label><label>New password<input name="newPassword" type="password" value={form.newPassword} onChange={update} minLength="8" autoComplete="new-password" /></label></div>{error && <p className="error" role="alert">{error}</p>}{message && <p className="profile-success">{message}</p>}<button className="submit-button profile-save" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></form></section>
}
