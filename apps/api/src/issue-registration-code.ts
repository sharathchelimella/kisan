import { authEmailSchema } from "@kisan/contracts";
import { issueRegistrationCode } from "./services/auth.crypto";

const email = authEmailSchema.safeParse(process.argv[2]);
const secret = process.env.AUTH_REGISTRATION_SECRET;
if (!email.success || !secret || secret.length < 32) {
  process.stderr.write(
    "Provide an email address and configure AUTH_REGISTRATION_SECRET (at least 32 characters).\n",
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    issueRegistrationCode(
      email.data,
      secret,
      Math.floor(Date.now() / 1000) + 24 * 3600,
    ) + "\n",
  );
}
