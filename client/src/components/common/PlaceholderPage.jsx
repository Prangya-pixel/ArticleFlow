export default function PlaceholderPage({ eyebrow, title, description }) {
  return <section className="placeholder-page"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lead">{description}</p><div className="placeholder-card"><span>✦</span><p>Placeholder surface ready for the feature team.</p></div></section>
}
