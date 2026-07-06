import BaseRepository from "./baseRepository.js";
import { Op } from "sequelize";

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



  async getAllCategories({ offset = 0, limit = 10 }) {
    return await this.findAndCountAll({},{ offset, limit, order: [["created_at", "DESC"]],include:[{association:"children"}]});
  }

}

export default new CategoryRepository();