/**
 * Server-only environment access. Nothing here may be imported by client
 * components — secrets must never reach the browser bundle.
 */

const read = (name: string) => {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
};

export const env = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  /** libSQL URL: `file:./data/uma.db` locally, `libsql://…` for a hosted database. */
  get databaseUrl() {
    return read("DATABASE_URL") ?? "file:./data/uma.db";
  },
  get databaseAuthToken() {
    return read("DATABASE_AUTH_TOKEN");
  },
  get razorpayKeyId() {
    return read("RAZORPAY_KEY_ID");
  },
  get razorpayKeySecret() {
    return read("RAZORPAY_KEY_SECRET");
  },
  get razorpayWebhookSecret() {
    return read("RAZORPAY_WEBHOOK_SECRET");
  },
  get resendApiKey() {
    return read("RESEND_API_KEY");
  },
  get emailFrom() {
    return read("EMAIL_FROM");
  },
  get adminNotifyEmail() {
    return read("ADMIN_NOTIFY_EMAIL");
  },
  get cloudinaryCloudName() {
    return read("CLOUDINARY_CLOUD_NAME");
  },
  get cloudinaryApiKey() {
    return read("CLOUDINARY_API_KEY");
  },
  get cloudinaryApiSecret() {
    return read("CLOUDINARY_API_SECRET");
  },
  /** Local upload directory, used when Cloudinary is not configured. */
  get uploadDir() {
    return read("UPLOAD_DIR") ?? "./data/uploads";
  },
};
