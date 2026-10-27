import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SURGERY_CONDITION_DOCS } from "@/lib/surgeryConditionDocuments";
import { Search } from "lucide-react";

// Clinical grouping of the General Surgery diagnosis-specific note types —
// presentation only. The templates themselves are the existing ones.
const GROUPS = [
  { title: "Emergency, Trauma & Acute Abdomen", keys: ["surg_acute_abdomen", "surg_trauma"] },
  { title: "Appendix, Bowel & Abdominal Wall", keys: ["surg_appendicitis", "surg_bowel_obstruction", "surg_hernia", "surg_colorectal"] },
  { title: "Gallbladder, Biliary & Pancreas", keys: ["surg_biliary", "surg_hpb"] },
  { title: "Breast, Thyroid & Parathyroid", keys: ["surg_breast", "surg_thyroid"] },
  { title: "Upper GI & Endoscopy", keys: ["surg_upper_gi", "surg_endoscopy"] },
  { title: "Surgical Infection & Wound", keys: ["surg_infection"] },
];

// Search terms a clinician may type for each template — search only, the
// template titles themselves are unchanged.
const ALIASES = {
  surg_acute_abdomen: "acute abdomen peritonitis perforation emergency laparotomy",
  surg_trauma: "trauma injury polytrauma stab gunshot",
  surg_appendicitis: "appendicitis appendicectomy appendiceal right iliac fossa",
  surg_bowel_obstruction: "bowel obstruction adhesions ileus small bowel large bowel volvulus",
  surg_hernia: "hernia inguinal femoral incisional umbilical ventral groin abdominal wall",
  surg_colorectal: "colorectal colon rectal anorectal haemorrhoids fistula fissure diverticulitis",
  surg_biliary: "gallbladder biliary cholecystitis cholelithiasis gallstones choledocholithiasis jaundice",
  surg_hpb: "hepatobiliary pancreatic liver pancreas pancreatitis cyst",
  surg_breast: "breast lump mastitis carcinoma fibroadenoma biopsy",
  surg_thyroid: "thyroid parathyroid goitre goiter nodule hyperthyroidism",
  surg_upper_gi: "upper gi stomach gastric ulcer reflux perforated peptic",
  surg_endoscopy: "endoscopy gastroscopy colonoscopy ogd scope",
  surg_infection: "infection abscess wound cellulitis sepsis necrotising fasciitis",
};

const matches = (d, q) =>
  !q || d.label.toLowerCase().includes(q) || (ALIASES[d.key] || "").includes(q);

export default function DiagnosisNotePicker({ selectedKey, onSelect }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const grouped = GROUPS.map((g) => ({
      title: g.title,
      docs: g.keys
        .map((k) => SURGERY_CONDITION_DOCS.find((d) => d.key === k))
        .filter(Boolean),
    }));
    const known = new Set(GROUPS.flatMap((g) => g.keys));
    const rest = SURGERY_CONDITION_DOCS.filter((d) => !known.has(d.key));
    if (rest.length) grouped.push({ title: "Other General Surgery", docs: rest });
    return grouped
      .map((g) => ({
        ...g,
        docs: g.docs.filter((d) => matches(d, q)),
      }))
      .filter((g) => g.docs.length > 0);
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
        <Input
          className="h-8 pl-8 text-sm"
          placeholder="Search diagnoses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {groups.map((g) => (
          <div key={g.title} className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground px-1">{g.title}</p>
            {g.docs.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onSelect(d.key)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-md border transition-colors ${
                  selectedKey === d.key
                    ? "border-primary bg-secondary text-foreground"
                    : "border-transparent hover:bg-secondary text-foreground"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground px-1 py-2">No diagnosis matches "{query}".</p>
        )}
      </div>
    </div>
  );
}