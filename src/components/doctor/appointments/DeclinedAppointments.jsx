import React from "react";
import { Trash2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "./appointmentStatus";

export default function DeclinedAppointments({ items, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No declined appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((apt) => {
        const deletable = apt.patient_response === "declined";
        return (
          <div key={apt.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{apt.patient_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">CIN: {apt.patient_cin}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Original appointment: {apt.date} at {apt.time}</span>
                  {apt.response_date && <span>Declined: {formatDateTime(apt.response_date)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  {deletable ? "Declined by Patient" : "Cancelled"}
                </span>
                {deletable && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" title="Delete declined appointment">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this declined appointment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the declined appointment for {apt.patient_name} ({apt.date} at {apt.time}).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(apt)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}