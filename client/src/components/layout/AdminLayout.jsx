import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../common/Navbar';
import { moderationService } from '../../services/moderationService';

export default function AdminLayout() {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadPending() {
      try {
        const stats = await moderationService.getStats();
        if (active) setPendingCount(stats.counts?.needsReview || 0);
      } catch {
        if (active) setPendingCount(0);
      }
    }
    loadPending();
    const interval = setInterval(loadPending, 20000);
    return () => { active = false; clearInterval(interval); };
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', to: '/admin/home' },
    { label: 'Articles', to: '/admin/browse' },
    { label: 'Moderation', to: '/admin/moderation', badge: pendingCount },
    { label: 'Notifications', to: '/admin/notifications' },
    { label: 'Settings', to: '/admin/settings' },
    { label: 'Profile', to: '/admin/profile' },
  ];

  return (
    <div className="app-shell">
      <Navbar role="admin" items={navItems} />
      <div className="workspace">
        <aside className="sidebar admin-sidebar">
          <p className="eyebrow">Admin Console</p>
          <h2>CMS Workspace</h2>
          <p>Review and manage publishing, moderation queues, and system parameters.</p>

          <nav className="admin-side-nav" aria-label="Admin sidebar navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'side-nav-link active' : 'side-nav-link')}
              >
                <span className="side-nav-text">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="side-nav-badge" aria-label={`${item.badge} pending items`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
