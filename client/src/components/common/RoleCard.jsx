import { Link } from 'react-router-dom'

export default function RoleCard({ role, description, icon, to }) {
  return (
    <Link className="role-card" to={to}>
      <span className="role-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong>{role} Login</strong>
        <small>{description}</small>
      </span>
      <span className="arrow" aria-hidden="true">→</span>
    </Link>
  )
}
