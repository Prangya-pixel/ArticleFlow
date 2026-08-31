export default function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const categories = ['Science', 'Technology', 'Health', 'Culture']

  const handleSelect = (category) => {
    if (selectedCategory === category) {
      onSelectCategory(null) // Deselect on click again
    } else {
      onSelectCategory(category)
    }
  }

  return (
    <div className="category-filter-container">
      <span className="filter-label eyebrow">Filter by Category</span>
      <div className="category-pills">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleSelect(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  )
}
