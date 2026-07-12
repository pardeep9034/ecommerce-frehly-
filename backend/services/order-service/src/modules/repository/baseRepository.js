import initializeModels from "../../models/index.js";

class BaseRepository {
  constructor(modelName) {
    this.modelName = modelName;
  }

  async getModel() {
    const db = await initializeModels();
    return db[this.modelName];
  }

  async create(data, options = {}) {
    const Model = await this.getModel();
    return await Model.create(data, options);
  }

  async bulkCreate(data, options = {}) {
    const Model = await this.getModel();
    return await Model.bulkCreate(data, options);
  }

  async findById(id, options = {}) {
    const Model = await this.getModel();
    return await Model.findByPk(id, options);
  }

  async findOne(query = {}, options = {}) {
    const Model = await this.getModel();
    return await Model.findOne({ where: query, ...options });
  }

  async findAll(query = {}, options = {}) {
    const Model = await this.getModel();
    return await Model.findAll({ where: query, ...options });
  }

  async update(query, data, options = {}) {
    const Model = await this.getModel();
    return await Model.update(data, { where: query, ...options });
  }

  async updateById(id, data, options = {}) {
    const Model = await this.getModel();
    return await Model.update(data, { where: { id }, ...options });
  }

  async delete(query, options = {}) {
    const Model = await this.getModel();
    return await Model.destroy({ where: query, ...options });
  }

  async deleteById(id, options = {}) {
    const Model = await this.getModel();
    return await Model.destroy({ where: { id }, ...options });
  }

  async findAndCountAll(query = {}, options = {}) {
    const Model = await this.getModel();
    return await Model.findAndCountAll({ where: query, ...options });
  }
}

export default BaseRepository;
