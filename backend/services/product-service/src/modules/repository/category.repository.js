import BaseRepository from "./baseRepository.js";
import { Op, literal } from "sequelize";

class CategoryRepository extends BaseRepository {
  constructor() {
    super("Category");
  }
  async findByName(name) {
    return await this.findOne({ name });
  }

  async findBySlug(slug) {
    return await this.findOne({ slug });
  }
  async findExisting(name, slug) {
    return await this.findOne(
     {
        [Op.or]: [
          { name: name },
          { slug: slug }
        ]
      
    })
  }



  async getAllCategories() {
    // Scalar subqueries (same approach as brands): no GROUP BY, so findAndCountAll's total stays a plain
    // number. One for the category rows, one for the nested children the tree view renders.
    const countProducts = (alias) => [
      literal(`(SELECT COUNT(*) FROM products WHERE products.category_id = "${alias}"."id")`),
      "productCount",
    ];
    return await this.findAndCountAll({},{
      order: [["created_at", "DESC"]],
      attributes: { include: [countProducts("Category")] },
      include:[{ association:"children", attributes: { include: [countProducts("children")] } }],
    });
  }
  async getCategorySelection({ offset = 0, limit = 10, search = "" }) {
  const whereClause = search ? { name: { [Op.iLike]: `%${search}%` } } : {};
  return await this.findAndCountAll(whereClause, { offset, limit, attributes: ["id", "name", "parent_id"], order: [["created_at", "DESC"]] });
}

}


export default new CategoryRepository();