import { APPOINTMENT_STATUSES } from "@/lib/status";
import { listAllAppointments } from "@/server/services/boutique";
import { AppointmentRow } from "@/components/admin/AppointmentRow";
import { EmptyRow, FilterTabs, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = APPOINTMENT_STATUSES.find((s) => s === status);
  const appointments = await listAllAppointments(filter);

  return (
    <>
      <PageTitle title="Appointments" description="Confirm, reschedule or cancel boutique visits." />
      <FilterTabs basePath="/admin/appointments" current={filter} options={APPOINTMENT_STATUSES} />
      {appointments.length === 0 ? (
        <EmptyRow>No {filter ? filter.toLowerCase() : ""} appointments.</EmptyRow>
      ) : (
        <ul className="space-y-4">
          {appointments.map((a) => (
            <AppointmentRow key={`${a.id}-${a.date}-${a.time}-${a.adminNotes}`} appointment={a} />
          ))}
        </ul>
      )}
    </>
  );
}
