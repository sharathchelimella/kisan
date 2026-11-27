import { JobModel } from "./models/Job.model";
import { InvoiceModel } from "./models/Invoice.model";
import { ReceiptModel } from "./models/Receipt.model";
import { AllocationModel } from "./models/Allocation.model";
import { EquipmentModel } from "./models/Equipment.model";
import { ServiceModel } from "./models/Service.model";
import { FarmerModel } from "./models/Farmer.model";
import { createAuthService } from "./services/auth.service";
import {
  initializeAuthCollections,
  mongoAuthRepository,
} from "./services/auth.repository";
import { createApp } from "./app";
import { readEnv } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";

async function main() {
  const env = readEnv(process.env);
  if (env.MONGODB_URI) {
    await connectDatabase(env.MONGODB_URI);
    await initializeAuthCollections();
    await FarmerModel.createIndexes();
    await EquipmentModel.createIndexes();
    await ServiceModel.createIndexes();
    await JobModel.createIndexes();
    await InvoiceModel.createIndexes();
    await ReceiptModel.createIndexes();
    await AllocationModel.createIndexes();
  }
  const server = createApp({
    auth: env.MONGODB_URI
      ? createAuthService(mongoAuthRepository, env.AUTH_REGISTRATION_SECRET)
      : undefined,
    secureCookies: env.NODE_ENV === "production",
  }).listen(env.PORT, env.HOST, () => {
    process.stdout.write(`Kisan API listening on ${env.HOST}:${env.PORT}\n`);
  });
  server.once("error", (error: NodeJS.ErrnoException) => {
    process.stderr.write(`API listener failed (${error.code ?? "UNKNOWN"}).\n`);
    process.exitCode = 1;
    void disconnectDatabase();
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      server.close(() => void disconnectDatabase());
    });
  }
}

main().catch(async () => {
  process.stderr.write(
    "API startup failed. Check environment values and MongoDB connectivity.\n",
  );
  process.exitCode = 1;
  await disconnectDatabase();
});
