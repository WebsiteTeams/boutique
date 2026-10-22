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
  /**
   * The seeded admin login from .env.local, shown on /admin/login as a convenience
   * during local development only. Always null in production.
   */
  get devAdminLogin(): { email: string; password: string } | null {
    if (process.env.NODE_ENV === "production") return null;
    const email = read("ADMIN_EMAIL");
    const password = read("ADMIN_PASSWORD");
    return email && password ? { email, password } : null;
  },
  /** MongoDB connection string, e.g. mongodb://127.0.0.1:27017/uma_designers or a mongodb+srv:// Atlas URI. */
  get mongodbUri() {
    return read("MONGODB_URI") ?? "mongodb://127.0.0.1:27017/uma_designers";
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
