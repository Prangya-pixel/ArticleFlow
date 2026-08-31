import Tag from '../models/Tag.js';

// CREATE TAG
export async function createTag(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Tag name is required.',
      });
    }

    const existingTag = await Tag.findOne({
      name: name.trim(),
    });

    if (existingTag) {
      return res.status(409).json({
        message: 'Tag already exists.',
      });
    }

    const tag = await Tag.create({
      name: name.trim(),
      description: description?.trim() || '',
    });

    return res.status(201).json({
      message: 'Tag created successfully.',
      tag,
    });
  } catch (error) {
    console.error('Create tag error:', error);

    return res.status(500).json({
      message: 'Failed to create tag.',
    });
  }
}

// GET ALL TAGS
export async function getTags(req, res) {
  try {
    const tags = await Tag.find().sort({ name: 1 });

    return res.status(200).json({
      tags,
    });
  } catch (error) {
    console.error('Get tags error:', error);

    return res.status(500).json({
      message: 'Failed to fetch tags.',
    });
  }
}

// UPDATE TAG
export async function updateTag(req, res) {
  try {
    const { name, description, isActive } = req.body;

    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        message: 'Tag not found.',
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          message: 'Tag name cannot be empty.',
        });
      }

      const duplicate = await Tag.findOne({
        name: trimmedName,
        _id: { $ne: tag._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: 'Another tag with this name already exists.',
        });
      }

      tag.name = trimmedName;
    }

    if (description !== undefined) {
      tag.description = description.trim();
    }

    if (isActive !== undefined) {
      tag.isActive = Boolean(isActive);
    }

    await tag.save();

    return res.status(200).json({
      message: 'Tag updated successfully.',
      tag,
    });
  } catch (error) {
    console.error('Update tag error:', error);

    return res.status(500).json({
      message: 'Failed to update tag.',
    });
  }
}

// DELETE TAG
export async function deleteTag(req, res) {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        message: 'Tag not found.',
      });
    }

    await Tag.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: 'Tag deleted successfully.',
    });
  } catch (error) {
    console.error('Delete tag error:', error);

    return res.status(500).json({
      message: 'Failed to delete tag.',
    });
  }
}