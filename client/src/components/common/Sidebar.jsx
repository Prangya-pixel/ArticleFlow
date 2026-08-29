export default function Sidebar({ title, description }) {
  return (
    <aside className="sidebar">
      <p className="eyebrow">Workspace</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </aside>
  )
}
