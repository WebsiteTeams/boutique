import { createHash } from "node:crypto";
import { absoluteUrl, siteConfig } from "@/lib/config";
import { hashPassword } from "@/server/auth/password";
import { env } from "@/server/config/env";
import { PasswordResetTokens, Sessions, Users } from "@/server/db/models";
import { isEmailConfigured, sendEmail } from "@/server/services/notifications";
import { badRequest, serviceUnavailable } from "@/server/utils/errors";
import { now, randomToken } from "@/server/utils/ids";

const TOKEN_MINUTES = 60;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Emails a single-use reset link when an account exists for the address.
 * The response never reveals whether it does. Without email configured,
 * production refuses (so we never claim a link was sent) and development
 * logs the link to the server console instead.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!isEmailConfigured() && env.isProduction) {
    throw serviceUnavailable(
      `We can't send reset emails right now. Please contact us at ${siteConfig.email} and we'll help you back in.`
    );
  }

  const user = await Users.findOne({ email }, { _id: 1, name: 1 }).lean();
  if (!user) return;

  // Only the newest link works.
  await PasswordResetTokens.deleteMany({ userId: user._id });
  const token = randomToken();
  await PasswordResetTokens.create({
    _id: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60 * 1000).toISOString(),
    createdAt: now(),
  });

  const link = absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`);
  const sent = await sendEmail({
    to: email,
    subject: "Reset your UMA Designers password",
    text: `Hi ${user.name},\n\nWe received a request to reset your password. Choose a new one here (the link works once and expires in ${TOKEN_MINUTES} minutes):\n\n${link}\n\nIf you didn't ask for this, you can ignore this email — your password won't change.`,
  });
  if (!sent && !env.isProduction) {
    console.info(`[password-reset] Email is not configured. Reset link for ${email}: ${link}`);
  }
}

/** Sets a new password from a valid link, then signs the account out everywhere. */
export async function resetPassword(token: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  // Claim the token in one atomic update, so the same link can never be used twice.
  const claimed = await PasswordResetTokens.findOneAndUpdate(
    { _id: hashToken(token), usedAt: null, expiresAt: { $gt: now() } },
    { $set: { usedAt: now() } },
    { new: true }
  ).lean();
  if (!claimed) {
    throw badRequest("This reset link has expired or was already used. Please request a new one.");
  }
  await Users.updateOne({ _id: claimed.userId }, { $set: { passwordHash } });
  await Sessions.deleteMany({ userId: claimed.userId });
}
