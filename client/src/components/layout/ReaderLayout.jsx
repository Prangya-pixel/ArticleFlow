import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'

const items = [
  { label: 'Home', to: '/reader/home' },
  { label: 'Browse', to: '/reader/browse' },
  { label: 'Profile', to: '/reader/profile' },
]

export default function ReaderLayout() {
  return (
    <div className="app-shell">
      <Navbar role="reader" items={items} />
      <div className="workspace">
        <Sidebar title="Reading room" description="Find thoughtful stories worth your time." />
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
