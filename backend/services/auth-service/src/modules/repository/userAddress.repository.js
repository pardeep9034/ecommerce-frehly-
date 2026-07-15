import BaseRepository from "./BaseRepository.js";

class UserAddressRepository extends BaseRepository {
  constructor() {
    super("AuthUserAddress");
  }

  async findByUserId(userId, options = {}) {
    return await this.findAndCountAll(
      { user_id: userId },
      {
        order: [["is_default", "DESC"], ["created_at", "DESC"]],
        ...options
      }
    );
  }

  async findByIdAndUserId(id, userId, options = {}) {
    return await this.findOne({ id, user_id: userId }, options);
  }

  async clearDefaultForUser(userId, options = {}) {
    return await this.update(
      { user_id: userId, is_default: true },
      { is_default: false },
      options
    );
  }

  async updateByIdAndUserId(id, userId, data, options = {}) {
    return await this.update({ id, user_id: userId }, data, options);
  }

  async deleteByIdAndUserId(id, userId, options = {}) {
    return await this.delete({ id, user_id: userId }, options);
  }
}

export default new UserAddressRepository();
