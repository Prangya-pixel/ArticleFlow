import { NavLink } from 'react-router-dom'
import SignOutButton from './SignOutButton'

export default function Navbar({ items, role }) {
  return (
    <header className="navbar">
      <NavLink className="brand" to={`/${role}/home`}>
        <span className="brand-mark">A</span>
        ArticleFlow
      </NavLink>
      <nav className="nav-links" aria-label={`${role} navigation`}>
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="user-actions">
        <span className="role-pill">{role}</span>
        <SignOutButton />
      </div>
    </header>
  )
}
