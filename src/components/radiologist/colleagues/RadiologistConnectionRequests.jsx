import React from "react";
import { Button } from "@/components/ui/button";
import RadiologistColleagueCard from "./RadiologistColleagueCard";

// Pending (incoming) and Sent (outgoing) connection requests between
// radiologists. The receiving radiologist accepts or declines; a sent
// request can be cancelled.
export default function RadiologistConnectionRequests({ incoming, outgoing, radiologistMap, onAccept, onDecline, onCancel, busyId }) {
  if (incoming.length === 0 && outgoing.length === 0) return null;

  const display = (conn, iAmRequester) => {
    const id = iAmRequester ? conn.recipient_radiologist_id : conn.requester_radiologist_id;
    return (
      radiologistMap[id] || {
        id,
        full_name: iAmRequester ? conn.recipient_name : conn.requester_name,
      }
    );
  };

  return (
    <>
      {incoming.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm mb-3">Pending Requests ({incoming.length})</h3>
          <div className="space-y-2.5">
            {incoming.map((c) => (
              <RadiologistColleagueCard
                key={c.id}
                colleague={display(c, false)}
                actions={
                  <>
                    <Button size="sm" onClick={() => onAccept(c)} disabled={busyId === c.id}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDecline(c)} disabled={busyId === c.id}>
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h3 className="font-semibold text-sm mb-3">Sent Requests ({outgoing.length})</h3>
          <div className="space-y-2.5">
            {outgoing.map((c) => (
              <RadiologistColleagueCard
                key={c.id}
                colleague={display(c, true)}
                actions={
                  <Button size="sm" variant="outline" onClick={() => onCancel(c)} disabled={busyId === c.id}>
                    Cancel Request
                  </Button>
                }
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}