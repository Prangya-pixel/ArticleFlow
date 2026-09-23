import Article from '../models/Article.js'
import Notification from '../models/Notification.js'

export async function getSpamApprovalQueue(req, res, next) {
  try {
    const articles = await Article.find({
      status: 'Pending',
      spamStatus: { $in: ['Flagged', 'Not Checked'] }
    }).sort({ createdAt: -1 })

    return res.json(articles)
  } catch (error) {
    next(error)
  }
}

export async function approveSpamContent(req, res, next) {
  try {
    const article = await Article.findById(req.params.id)

    if (!article) {
      return res.status(404).json({
        message: 'Article not found.'
      })
    }

    if (article.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending articles can be reviewed for spam approval.'
      })
    }

    article.spamStatus = 'Approved'
    article.spamReviewedBy = req.user._id
    article.spamReviewedAt = new Date()

    await article.save()

    return res.json({
      message: 'Spam content approved successfully.',
      article
    })
  } catch (error) {
    next(error)
  }
}

export async function rejectSpamContent(req, res, next) {
  try {
    const { adminNote } = req.body

    if (!adminNote?.trim()) {
      return res.status(400).json({
        message: 'Rejection reason is required.'
      })
    }

    const article = await Article.findById(req.params.id)

    if (!article) {
      return res.status(404).json({
        message: 'Article not found.'
      })
    }

    if (article.status !== 'Pending') {
      return res.status(400).json({
        message: 'Only pending articles can be reviewed for spam approval.'
      })
    }

    article.spamStatus = 'Rejected'
    article.spamReviewedBy = req.user._id
    article.spamReviewedAt = new Date()

    await article.save()

    await Notification.create({
      recipient: article.author,
      article: article._id,
      type: 'REJECTED',
      message: `Your article "${article.title}" was rejected during spam content review. Reason: ${adminNote.trim()}`
    })

    return res.json({
      message: 'Spam content rejected successfully.',
      article
    })
  } catch (error) {
    next(error)
  }
}