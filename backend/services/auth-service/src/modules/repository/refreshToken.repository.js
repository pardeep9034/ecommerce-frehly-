import initializeModels from "../../models/index.js";
import { Op } from "sequelize";

class RefreshTokenRepository {

  /* ================= CREATE SESSION ================= */
  async create(payload) {

    if (payload) {

      const db = await initializeModels();

      return db.RefreshToken.create({
        user_id: payload.user_id,
        token_hash: payload.token_hash,
        expires_at: payload.expires_at,
        is_revoked: false,
      });

    } else {

      return null;
    }
  }

  /* ================= FIND VALID SESSION (HASH + EXPIRY) ================= */
  async findValidByTokenHash(tokenHash) {

    if (tokenHash) {

      const db = await initializeModels();

      return db.RefreshToken.findOne({
        where: {
          token_hash: tokenHash,
          is_revoked: false,
          expires_at: {
            [Op.gt]: new Date(), // 🔥 expiry check
          },
        },
      });

    } else {

      return null;
    }
  }

  /* ================= ROTATE SESSION ================= */
  async updateById(id, payload) {

    if (id && payload) {

      const db = await initializeModels();

      return db.RefreshToken.update(
        payload,
        { where: { id } }
      );

    } else {

      return null;
    }
  }

  /* ================= REVOKE SINGLE SESSION ================= */
  async revokeByTokenHash(tokenHash) {

    if (tokenHash) {

      const db = await initializeModels();

      return db.RefreshToken.update(
        { is_revoked: true },
        { where: { token_hash: tokenHash } }
      );

    } else {

      return null;
    }
  }

  /* ================= REVOKE ALL USER SESSIONS ================= */
  async revokeAllByUserId(userId) {

    if (userId) {

      const db = await initializeModels();

      return db.RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId } }
      );

    } else {

      return null;
    }
  }
}

export default new RefreshTokenRepository();
