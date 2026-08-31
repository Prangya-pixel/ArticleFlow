import { SearchBrowse } from '../../modules/search'

export default function AdminBrowse() {
  return (
    <div className="browse-page-wrapper">
      <span className="eyebrow">Content Library</span>
      <h1 className="browse-page-title" style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', margin: '0 0 2rem' }}>
        Browse submitted content.
      </h1>
      <SearchBrowse scope="admin" />
    </div>
  )
}
