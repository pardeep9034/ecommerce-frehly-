import { db } from "../../models/index.js";

class CategoryRepository {

  async findByName(name) {
    return await db.Category.findOne({
      where: { name }
    });
  }

  async findBySlug(slug) {
    return await db.Category.findOne({
      where: { slug }
    });
  }
  async findById(id) {
    return await db.Category.findByPk(id);
  }

  async create(categoryData) {
    return await db.Category.create(categoryData);
  }
  async getAllCategories({ offset = 0, limit = 10 }) {
    return await db.Category.findAndCountAll({ offset, limit, order: [["createdAt", "DESC"]] });
  }

  async updateById(id, updateData) {
    const [affectedRows] = await db.Category.update(updateData, {
      where: { id }
    });

    if (affectedRows > 0) {
      return await db.Category.findByPk(id);
    } else {
      return null;
    }
  }

  async deleteById(id) {
    const deletedRows = await db.Category.destroy({
      where: { id }
    });

    return deletedRows > 0;
  }

}

export default CategoryRepository;