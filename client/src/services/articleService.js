import { mockArticles } from '../modules/search/fixtures'

// TEMP: mock implementation — replace when article backend lands
export const articleService = {
  async listArticles(filters = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...mockArticles];

        // Filter by role/status scope
        if (filters.scope === 'reader' || filters.scope === 'author') {
          results = results.filter(article => article.status === 'Published');
        } else if (filters.scope === 'admin') {
          // Admin sees all statuses
          if (filters.status) {
            results = results.filter(article => article.status === filters.status);
          }
        }

        // Filter by category (single-select)
        if (filters.category) {
          results = results.filter(article => article.category.toLowerCase() === filters.category.toLowerCase());
        }

        // Filter by search query (title and excerpt)
        if (filters.search) {
          const query = filters.search.toLowerCase().trim();
          results = results.filter(article => 
            article.title.toLowerCase().includes(query) || 
            article.excerpt.toLowerCase().includes(query)
          );
        }

        resolve(results);
      }, 200); // Artificial delay to simulate network call
    });
  },

  async getArticleById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const article = mockArticles.find(a => a.id === id);
        if (article) {
          resolve(article);
        } else {
          reject(new Error('Article not found'));
        }
      }, 200);
    });
  }
};
