import React from "react";
import { LAB_STATUS, normalizeLabStatus } from "@/lib/labRequestUtils";

export default function LabStatusBadge({ status }) {
  const cfg = LAB_STATUS[normalizeLabStatus(status)];
  return null;




}