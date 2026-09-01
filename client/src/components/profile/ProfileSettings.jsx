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
  const initials = user.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
  return <section className="profile-page"><div className="profile-hero"><div className="profile-avatar">{initials}</div><div><span className="eyebrow">{user.role} profile</span><h1>{title}</h1><p className="lead">{description}</p></div></div><form className="profile-form" onSubmit={submit}><div className="profile-card"><div className="profile-card-heading"><div><h2>Account details</h2><p>This information is visible across your workspace.</p></div><span className="profile-role">{user.role}</span></div><div className="profile-fields"><label>Display name<input name="name" value={form.name} onChange={update} required minLength="2" /></label><label>Email address<input name="email" type="email" value={form.email} onChange={update} required /></label></div></div><div className="profile-card"><div className="profile-card-heading"><div><h2>Security</h2><p>Use a strong password that you do not reuse elsewhere.</p></div></div><div className="profile-fields"><label>Current password<input name="currentPassword" type="password" value={form.currentPassword} onChange={update} autoComplete="current-password" /></label><label>New password<input name="newPassword" type="password" value={form.newPassword} onChange={update} minLength="8" autoComplete="new-password" placeholder="At least 8 characters" /></label></div></div>{error && <p className="error" role="alert">{error}</p>}{message && <p className="profile-success">✓ {message}</p>}<button className="submit-button profile-save" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form></section>
}
