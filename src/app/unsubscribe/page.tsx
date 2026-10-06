"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { Button, LinkButton } from "@/components/ui/Button";

function UnsubscribeInner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<{ status: "idle" | "busy" | "done" | "error"; message?: string }>({
    status: "idle",
  });

  const confirm = async () => {
    setState({ status: "busy" });
    try {
      const res = await api<{ email: string }>("/api/newsletter/unsubscribe", { body: { token } });
      setState({ status: "done", message: res.email });
    } catch (error) {
      setState({ status: "error", message: errorMessage(error) });
    }
  };

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-32 text-center sm:px-8 lg:pt-40">
      <p className="eyebrow mb-3 text-gold-deep">Newsletter</p>
      <h1 className="type-heading-xl text-charcoal">
        {state.status === "done" ? "You're unsubscribed" : "Unsubscribe from UMA emails"}
      </h1>
      {state.status === "done" ? (
        <>
          <p className="mt-4 text-mist" role="status">
            {state.message} will no longer receive our newsletter. You are welcome back any time.
          </p>
          <LinkButton href="/" variant="outline" className="mt-7">
            Return Home
          </LinkButton>
        </>
      ) : !token ? (
        <p className="mt-4 text-mist">This unsubscribe link is incomplete. Please use the link from our email.</p>
      ) : (
        <>
          <p className="mt-4 text-mist">Confirm below and we will stop sending you collection updates.</p>
          {state.status === "error" && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {state.message}
            </p>
          )}
          <Button className="mt-7" onClick={confirm} disabled={state.status === "busy"}>
            {state.status === "busy" ? "Unsubscribing…" : "Confirm Unsubscribe"}
          </Button>
        </>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeInner />
    </Suspense>
  );
}
