import { Business } from "./models/Business.model";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { readEnv } from "./config/env";
import { reconcileBusiness } from "./services/reconciliation.repository";

async function main() {
  const env = readEnv(process.env);
  if (!env.MONGODB_URI)
    throw new Error("MONGODB_URI is required for reconciliation");
  await connectDatabase(env.MONGODB_URI);
  let failed = false;
  for await (const business of Business.find().select("_id").lean().cursor()) {
    const issues = await reconcileBusiness(business._id.toString());
    process.stdout.write(
      JSON.stringify({
        businessId: business._id.toString(),
        invoiceIssues: issues,
      }) + "\n",
    );
    if (issues.length) failed = true;
  }
  if (failed) process.exitCode = 1;
}

try {
  await main();
} catch {
  process.stderr.write(
    "Reconciliation failed; check database connectivity and configuration.\n",
  );
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
