import RoleCard from '../../components/common/RoleCard'

const roles = [
  { role: 'Author', description: 'Write, manage, and publish articles.', icon: '✎', to: '/author/home' },
  { role: 'Admin', description: 'Review content and guide the platform.', icon: '▣', to: '/admin/home' },
  { role: 'Reader', description: 'Discover stories and explore ideas.', icon: '◉', to: '/reader/home' },
]

export default function Login() {
  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="brand brand-static"><span className="brand-mark">A</span>ArticleFlow</span>
        <p className="eyebrow">A home for curious minds</p>
        <h1>Stories that move <em>ideas</em> forward.</h1>
        <p className="intro-copy">Choose how you want to enter the ArticleFlow workspace.</p>
      </section>
      <section className="login-panel">
        <p className="eyebrow">Welcome back</p>
        <h2>Select your role</h2>
        <div className="role-list">
          {roles.map((role) => <RoleCard key={role.role} {...role} />)}
        </div>
        <p className="helper-text">// TODO: Authentication teammate implementation</p>
      </section>
    </main>
  )
}
