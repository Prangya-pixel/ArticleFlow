import { useState, useEffect } from 'react'

export default function SearchBar({ value, onChange }) {
  const [inputVal, setInputVal] = useState(value)

  useEffect(() => {
    setInputVal(value)
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(inputVal)
    }, 300)

    return () => clearTimeout(handler)
  }, [inputVal, onChange])

  return (
    <div className="search-bar-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search articles by title or excerpt..."
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />
    </div>
  )
}
