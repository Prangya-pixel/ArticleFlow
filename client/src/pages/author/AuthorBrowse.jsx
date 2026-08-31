import { SearchBrowse } from '../../modules/search'

export default function AuthorBrowse() {
  return (
    <div className="browse-page-wrapper">
      <span className="eyebrow">Article Library</span>
      <h1 className="browse-page-title" style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', margin: '0 0 2rem' }}>
        Browse ideas.
      </h1>
      <SearchBrowse scope="author" />
    </div>
  )
}
