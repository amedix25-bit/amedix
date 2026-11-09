import React from "react";
import FmBlockField from "@/components/doctor/notes/FmBlockField";
import { imBlock, imBlockValue } from "@/lib/imBlocks";

// One structured internal-medicine block, rendered by the shared block renderer with
// the internal-medicine registry.
export default function ImBlockField({ fieldKey, value, onChange }) {
  return (
    <FmBlockField
      fieldKey={fieldKey}
      value={value}
      onChange={onChange}
      resolve={imBlock}
      wrap={imBlockValue}
    />
  );
}