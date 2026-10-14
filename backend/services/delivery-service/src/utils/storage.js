import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

// Partner documents on a private directory (a Docker volume), AES-256-GCM per file.
// ponytail: local disk. Swap these three functions for S3 if the service ever runs on more than one host.
const ROOT = path.resolve(env.STORAGE_DIR);
const KEY = Buffer.from(env.STORAGE_KEY, "hex");

// File layout: 12-byte IV, 16-byte auth tag, ciphertext.
const IV_BYTES = 12;
const TAG_BYTES = 16;

// A key can only name a file inside ROOT.
const locate = (key) => {
  const file = path.resolve(ROOT, key);
  if (!file.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key");
  return file;
};

export const put = async (key, buffer) => {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const body = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const file = locate(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.concat([iv, cipher.getAuthTag(), body]));
};

export const get = async (key) => {
  const raw = await fs.readFile(locate(key));
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, raw.subarray(0, IV_BYTES));
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
};

export const remove = (key) => fs.rm(locate(key), { force: true });
