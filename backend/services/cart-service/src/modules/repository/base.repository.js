import initializeModels from "../../models/index.js";

class BaseRepository {
    constructor(modelName) {
        this.modelName = modelName;
    }

    async getModel() {
        const db = await initializeModels();
        const model = db[this.modelName];
        if (!model) {
            throw new Error(`Model ${this.modelName} not found in database models`);
        }
        return model;
    }

    async create(data, options = {}) {
        const model = await this.getModel();
        return await model.create(data, options);
    }

    async findOne(options = {}) {
        const model = await this.getModel();
        return await model.findOne(options);
    }

    async findAll(options = {}) {
        const model = await this.getModel();
        return await model.findAll(options);
    }

    async update(data, options = {}) {
        const model = await this.getModel();
        return await model.update(data, options);
    }

    async destroy(options = {}) {
        const model = await this.getModel();
        return await model.destroy(options);
    }

    async findByPk(id, options = {}) {
        const model = await this.getModel();
        return await model.findByPk(id, options);
    }
}

export default BaseRepository;
