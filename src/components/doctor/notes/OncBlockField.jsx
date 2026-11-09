import React from "react";
import FmBlockField from "@/components/doctor/notes/FmBlockField";
import { oncBlock, oncBlockValue } from "@/lib/oncBlocks";

// One structured oncology block, rendered by the shared block renderer with the
// oncology registry.
export default function OncBlockField({ fieldKey, value, onChange }) {
  return (
    <FmBlockField
      fieldKey={fieldKey}
      value={value}
      onChange={onChange}
      resolve={oncBlock}
      wrap={oncBlockValue}
    />
  );
}