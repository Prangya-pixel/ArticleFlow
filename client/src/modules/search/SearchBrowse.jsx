import { useState, useEffect } from 'react'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import ArticleGrid from './ArticleGrid'
import { articleService } from '../../services/articleService'
import Loading from '../../components/common/Loading'

export default function SearchBrowse({ scope }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    articleService.listArticles({ scope, category, search })
      .then((data) => {
        if (active) {
          setArticles(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error(err)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [scope, category, search])

  return (
    <div className="search-browse-container">
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter selectedCategory={category} onSelectCategory={setCategory} />

      {loading ? (
        <Loading />
      ) : (
        <ArticleGrid articles={articles} scope={scope} />
      )}
    </div>
  )
}
