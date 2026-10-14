// Run: docker compose exec -T delivery-service node storage.check.js   (writes only to a temp directory)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// env.js reads process.env when first imported, so set these before the dynamic import below.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "storage-check-"));
process.env.STORAGE_DIR = dir;
process.env.STORAGE_KEY ??= "ab".repeat(32);
process.env.DOC_HASH_KEY ??= "k".repeat(32);
process.env.DATABASE_URL ??= "postgres://u:p@localhost:5432/x";
process.env.JWT_SECRET ??= "j".repeat(32);
const storage = await import("./src/utils/storage.js");

try {
  const photo = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from("pretend this is a face")]);
  const key = "applications/app-1/photo-abc.jpg";

  await storage.put(key, photo);
  assert.deepEqual(await storage.get(key), photo, "round trip");

  const onDisk = fs.readFileSync(path.join(dir, key));
  assert.ok(!onDisk.includes("pretend this is a face"), "plain text must not be on disk");
  assert.notDeepEqual(onDisk.subarray(0, 3), photo.subarray(0, 3), "file must not start like a JPEG");

  await storage.put(key, photo);
  assert.notDeepEqual(fs.readFileSync(path.join(dir, key)), onDisk, "a fresh IV each write");

  const tampered = fs.readFileSync(path.join(dir, key));
  tampered[tampered.length - 1] ^= 1;
  fs.writeFileSync(path.join(dir, key), tampered);
  await assert.rejects(() => storage.get(key), "a changed byte must fail the auth tag");

  await assert.rejects(() => storage.put("../escape.txt", photo), /Invalid storage key/, "path traversal");
  await assert.rejects(() => storage.get("applications/../../etc/passwd"), /Invalid storage key/);

  await storage.remove(key);
  assert.ok(!fs.existsSync(path.join(dir, key)), "removed");
  await storage.remove(key); // removing a missing file is not an error

  console.log("storage.check.js: ok");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
