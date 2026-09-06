import User from '../models/User.js';
import Article from '../models/Article.js';

export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name username bio profilePhoto followersCount followingCount role'
    );

    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    const articles = await Article.find({
      author: user._id,
      status: 'Published',
    })
      .select(
        '_id title excerpt category tags authorName coverImage readMinutes views publishedAt createdAt'
      )
      .sort({ publishedAt: -1, createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username || '',
        bio: user.bio || '',
        profilePhoto: user.profilePhoto || '',
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        role: user.role,
      },
      articles: articles.map((article) => ({
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        tags: article.tags,
        authorName: article.authorName,
        coverImage: article.coverImage || '',
        readMinutes: article.readMinutes || 0,
        views: article.views || 0,
        publishedAt: article.publishedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};