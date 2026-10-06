import { MESSAGE_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { listContactMessages, listSubscribers } from "@/server/services/boutique";
import { StatusSelect } from "@/components/admin/controls";
import { AdminCard, AdminTable, EmptyRow, PageTitle, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Messages" };

export default async function AdminMessagesPage() {
  const [messages, subscribers] = await Promise.all([listContactMessages(), listSubscribers()]);
  const active = subscribers.filter((s) => s.status === "subscribed");

  return (
    <>
      <PageTitle title="Messages" description="Enquiries from the contact form and newsletter subscribers." />

      {messages.length === 0 ? (
        <EmptyRow>No enquiries yet.</EmptyRow>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-clay/60 bg-white/60 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-medium text-charcoal">{m.topic}</h3>
                  <p className="mt-0.5 text-xs text-mist">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="text-gold-deep underline underline-offset-4">
                      {m.email}
                    </a>
                    {m.phone ? ` · ${m.phone}` : ""} · {formatDate(m.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={m.status} />
                  <StatusSelect
                    endpoint={`/api/admin/messages/${m.id}`}
                    value={m.status}
                    options={MESSAGE_STATUSES}
                    label={`Status for message from ${m.name}`}
                  />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-mist">{m.message}</p>
            </li>
          ))}
        </ul>
      )}

      <AdminCard title={`Newsletter · ${active.length} active subscriber${active.length === 1 ? "" : "s"}`} className="mt-8">
        {subscribers.length === 0 ? (
          <EmptyRow>No newsletter sign-ups yet.</EmptyRow>
        ) : (
          <AdminTable head={["Email", "Status", "Subscribed"]} minWidth={420}>
            {subscribers.map((s) => (
              <tr key={s.email}>
                <Td className="text-charcoal">{s.email}</Td>
                <Td>
                  <StatusBadge status={s.status === "subscribed" ? "Active" : "Inactive"} />
                </Td>
                <Td className="tabular-nums text-mist">{formatDate(s.subscribedAt)}</Td>
              </tr>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
