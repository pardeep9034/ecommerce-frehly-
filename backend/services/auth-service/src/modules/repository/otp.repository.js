import BaseRepository from "./BaseRepository.js";
import { Op } from "sequelize";
import RedisManager from "../../config/redis.js";
import logger from "../../utils/Logger.js";

class OTPRepository extends BaseRepository {
  constructor() {
    super('OTP');
  }

  async findLatestOtp(userId, type, options = {}) {
    const redisClient=RedisManager.getClient();
    const redisKey=`otp:${userId}:${type}`;
    try{
      const cachedOtp=await redisClient.get(redisKey);
      if(cachedOtp){
        logger.info(`✅ Redis Hit! OTP found for user ${userId}`);
        return JSON.parse(cachedOtp);
      }
      logger.warn(`❌ Redis Miss! No OTP found for user ${userId}`);
      const dbOtp =await this.findLatestOtpFromDB(userId, type);
      if(dbOtp){
        const ttl=Math.floor((dbOtp.expires_at.getTime()-Date.now())/1000);
        if(ttl>0){
          await redisClient.setEx(redisKey,ttl,JSON.stringify(dbOtp));
          logger.info(`✅ Cached OTP in Redis for ${ttl} seconds`);
        }
      }
      return dbOtp;

    }catch(error){
      logger.error(`❌ Redis error: ${error.message}`);
      return await this.findLatestOtpFromDB(userId, type);
    }

    // if (!userId || !type) return null;
    // return await this.findOne({
    //   user_id: userId,
    //   type,
    //   used_at: null,
    //   expires_at: {
    //     [Op.gt]: new Date()
    //   }
    // }, {
    //   order: [['created_at', 'DESC']],
    //   ...options
    // });
    
  }

  async incrementAttempts(id, options = {}) {

    if (!id) return null;
    const Model = await this.getModel();
    return await Model.increment('attempt_count', {
      where: { id },
      ...options
    });

  }

  async markUsed(id, options = {}) {
    const {transaction}=options;
    const otp=await OtpModel.findByPk(id)
    if (!otp) throw new Error("OTP not found");
    otp.used_at=new Date();
    await otp.save({transaction});
    try{
      const redisClient=RedisManager.getClient();   
      const redisKey= `otp:${otp.user_id}:${otp.type}`;
      await redisClient.del(redisKey);
      logger.info(`✅ Removed OTP from Redis for user ${otp.user_id}`);
    }catch(error){
      logger.error(`❌ Redis error: ${error.message}`);
    }
    return otp;
  }

  async deleteExpiredOtps(options = {}) {
    const Model = await this.getModel();
    return await Model.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date()
        }
      },
      ...options
    });
  }

  async revokePendingOtps(userId, type, options = {}) {
    if (!userId || !type) return null;
    return await this.update(
      { user_id: userId, type, used_at: null },
      { used_at: new Date() }, // Or mark as invalidated
      options
    );
  }


  // Private method - DB query only
  async findLatestOtpFromDB(userId, type) {
    return await OtpModel.findOne({
      where: { user_id: userId, type },
      order: [['created_at', 'DESC']],
    });
  }

}

export default new OTPRepository();