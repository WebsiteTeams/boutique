import { siteConfig } from "@/lib/config";
import { env } from "@/server/config/env";
import { Notifications, plainAll, type NotificationRow } from "@/server/db/models";
import { newId, now } from "@/server/utils/ids";

export const isEmailConfigured = () => Boolean(env.resendApiKey && env.emailFrom);

/**
 * Sends a transactional email through Resend when RESEND_API_KEY and EMAIL_FROM
 * are configured. When they are not, nothing is sent and `false` is returned —
 * callers must not tell the customer an email was sent in that case.
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [message.to],
        subject: message.subject,
        text: `${message.text}\n\n— ${siteConfig.name}`,
      }),
    });
    if (!res.ok) console.error("[email] send failed", res.status, await res.text());
    return res.ok;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}

/**
 * Records an entry in the admin activity feed and, when email is configured,
 * also emails ADMIN_NOTIFY_EMAIL. Never throws — a notification failure must
 * not fail the customer's action.
 */
export async function notifyAdmin(entry: { type: string; title: string; body?: string; link?: string }) {
  try {
    await Notifications.create({
      _id: newId("ntf"),
      type: entry.type,
      title: entry.title,
      body: entry.body ?? "",
      link: entry.link ?? "",
      createdAt: now(),
    });
    if (env.adminNotifyEmail) {
      await sendEmail({
        to: env.adminNotifyEmail,
        subject: entry.title,
        text: [entry.body, entry.link ? `${siteConfig.url}${entry.link}` : ""].filter(Boolean).join("\n\n"),
      });
    }
  } catch (error) {
    console.error("[notify] failed", error);
  }
}

export const listNotifications = async (limit = 12) =>
  plainAll<NotificationRow>(await Notifications.find().sort({ createdAt: -1 }).limit(limit).lean());

export const markNotificationsRead = () => Notifications.updateMany({ isRead: false }, { $set: { isRead: true } });
