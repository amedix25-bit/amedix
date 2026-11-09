import React from "react";
import FmBlockField from "@/components/doctor/notes/FmBlockField";
import { dmBlock, dmBlockValue } from "@/lib/dmBlocks";

// One structured dermatology block, rendered by the shared block renderer with the
// dermatology registry.
export default function DmBlockField({ fieldKey, value, onChange }) {
  return <FmBlockField fieldKey={fieldKey} value={value} onChange={onChange} resolve={dmBlock} wrap={dmBlockValue} />;
}