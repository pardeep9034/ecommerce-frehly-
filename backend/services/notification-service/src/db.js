import { Sequelize, QueryTypes } from "sequelize";
import { env } from "./config/env.js";

// Plain SQL throughout: the claim, the ON CONFLICT inserts and the merge-patch upsert are clearer than model calls.
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

export const select = (sql, replacements = {}) => sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
export const selectOne = async (sql, replacements) => (await select(sql, replacements))[0];
