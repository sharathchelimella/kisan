import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const execFile = promisify(execFileCallback);
const sourceName = "kisan_backup_source";
const restoredName = "kisan_backup_restored";
const windowsMongo = "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe";

async function run() {
  const archive = join(tmpdir(), `kisan-restore-${randomUUID()}.archive.gz`);
  let server: MongoMemoryServer | undefined;
  try {
    server = await MongoMemoryServer.create({
      binary: {
        systemBinary:
          process.env.MONGOMS_SYSTEM_BINARY ??
          (process.platform === "win32" && existsSync(windowsMongo)
            ? windowsMongo
            : undefined),
      },
    });
    const uri = server.getUri();
    await mongoose.connect(uri);
    const source = mongoose.connection.getClient().db(sourceName);
    const businessId = new Types.ObjectId();
    const farmerId = new Types.ObjectId();
    const invoiceId = new Types.ObjectId();
    const receiptId = new Types.ObjectId();
    await source.collection("farmers").insertOne({
      _id: farmerId,
      businessId,
      name: "Restore fixture",
      village: "Test village",
    });
    await source.collection("invoices").insertOne({
      _id: invoiceId,
      businessId,
      farmerId,
      invoiceNumber: "TEST-000001",
      totalPaise: 270000,
      paidPaise: 100000,
      duePaise: 170000,
      status: "PARTIAL",
      lines: [{ amountPaise: 270000 }],
    });
    await source.collection("receipts").insertOne({
      _id: receiptId,
      businessId,
      farmerId,
      invoiceId,
      amountPaise: 100000,
      status: "POSTED",
    });
    await source.collection("allocations").insertOne({
      businessId,
      invoiceId,
      receiptId,
      amountPaise: 100000,
    });

    await execFile(process.env.MONGODUMP_BINARY ?? "mongodump", [
      `--uri=${uri}`,
      `--db=${sourceName}`,
      `--archive=${archive}`,
      "--gzip",
    ]);
    await execFile(process.env.MONGORESTORE_BINARY ?? "mongorestore", [
      `--uri=${uri}`,
      `--archive=${archive}`,
      "--gzip",
      `--nsFrom=${sourceName}.*`,
      `--nsTo=${restoredName}.*`,
    ]);
    const restored = mongoose.connection.getClient().db(restoredName);
    for (const collection of [
      "farmers",
      "invoices",
      "receipts",
      "allocations",
    ]) {
      const original = await source
        .collection(collection)
        .find()
        .sort({ _id: 1 })
        .toArray();
      const copy = await restored
        .collection(collection)
        .find()
        .sort({ _id: 1 })
        .toArray();
      assert.equal(copy.length, 1, `${collection} restore count`);
      assert.deepEqual(
        JSON.parse(JSON.stringify(copy)),
        JSON.parse(JSON.stringify(original)),
        `${collection} restore content`,
      );
    }
    process.stdout.write(
      "Backup and restore drill passed: four collections and financial references matched.\n",
    );
  } finally {
    await mongoose.disconnect();
    await server?.stop();
    await unlink(archive).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

run().catch(() => {
  process.stderr.write(
    "Backup and restore drill failed. Check MongoDB tools and the temporary replica set.\n",
  );
  process.exitCode = 1;
});
