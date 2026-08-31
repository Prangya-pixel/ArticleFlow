import Category from '../models/Category.js';

// CREATE CATEGORY
export async function createCategory(req, res) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Category name is required.',
      });
    }

    const existingCategory = await Category.findOne({
      name: name.trim(),
    });

    if (existingCategory) {
      return res.status(409).json({
        message: 'Category already exists.',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim() || '',
    });

    return res.status(201).json({
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({
      message: 'Failed to create category.',
    });
  }
}

// GET ALL CATEGORIES
export async function getCategories(req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 });

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({
      message: 'Failed to fetch categories.',
    });
  }
}

// UPDATE CATEGORY
export async function updateCategory(req, res) {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          message: 'Category name cannot be empty.',
        });
      }

      const duplicate = await Category.findOne({
        name: trimmedName,
        _id: { $ne: category._id },
      });

      if (duplicate) {
        return res.status(409).json({
          message: 'Another category with this name already exists.',
        });
      }

      category.name = trimmedName;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    return res.status(200).json({
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({
      message: 'Failed to update category.',
    });
  }
}

// DELETE CATEGORY
export async function deleteCategory(req, res) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({
      message: 'Failed to delete category.',
    });
  }
}