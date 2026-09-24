import { SearchBrowse } from '../../modules/search'

export default function ReaderBrowse() {
  return (
    <div className="browse-page-wrapper">
      <span className="eyebrow">Discover</span>
      <h1 className="browse-page-title" style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', margin: '0 0 2rem' }}>
        Browse the collection.
      </h1>
      <SearchBrowse scope="reader" />
    </div>
  )
}
