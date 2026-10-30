// Endocrinology ICD-11 MMS reference catalogue.
//
// EVERY code and display term below was extracted from the WHO ICD-11 MMS
// Simple Tabulation, release 2025-01 — the current release published by WHO:
//   https://icdcdn.who.int/static/releasefiles/2025-01/SimpleTabulation-ICD-11-MMS-en.xlsx
//   (plain-text tabulation file) retrieved 2026-10-28, Chapter 05
//   ("Endocrine, nutritional or metabolic diseases"), rows filtered by code.
// Titles are copied verbatim, including WHO's own spelling in
// "Postirridation hypothyroidism" — it is reproduced exactly as published so the
// record matches the source, not silently corrected.
//
// Scope of this catalogue — Chapter 05 categories at category level
// (depth ≤ 2 under the chapter), covering:
//   thyroid · diabetes · other disorders of glucose regulation ·
//   parathyroid · pituitary · adrenal · gonadal and puberty · polyglandular ·
//   overweight/obesity and nutrient excess · fluid and electrolyte ·
//   lipoprotein metabolism · postprocedural endocrine disorders
//
// Deliberately NOT included, and stated rather than silently omitted:
//  - Inborn errors of metabolism and metabolite transport disorders: they are
//    documented by the metabolic/paediatric services with their own catalogue.
//    A clinician can always add a code with its source from the WHO browser.
//  - Undernutrition and specific vitamin/mineral deficiency codes: those belong
//    to the Nutrition & Dietetics templates.
//  - Chapter 2 neoplasm codes: an endocrine tumour must be coded with its
//    histology from the WHO browser, so no partial neoplasm code is offered.
//  - Postcoordination detail (severity, laterality, control status): recorded in
//    the note's own structured fields; it never rewrites the stem code.
//
// Acute diabetes complications (5A20–5A24) are carried by the WHO tabulation as
// NON-primary entries (primary flag 0): they are documented together with the
// diabetes type rather than instead of it. The catalogue keeps that flag, and the
// picker shows it, so a clinician is never led to code "ketoacidosis" as if it
// replaced the type of diabetes.
//
// A code is never a diagnosis. The field records role, status and clinical basis,
// and only a clinician confirms.

export const ENDOCRINE_ICD11_MMS = {
  system: "ICD-11-MMS",
  system_uri: "http://id.who.int/icd/release/11/mms",
  release: "2025-01",
  label: "ICD-11 MMS",
  chapter: "Chapter 05 — Endocrine, nutritional or metabolic diseases",
  browser_url: "https://icd.who.int/browse/2025-01/mms/en",
  source_url: "https://icdcdn.who.int/static/releasefiles/2025-01/SimpleTabulation-ICD-11-MMS-en.xlsx",
  retrieved: "2026-10-28",
};

export const ENDOCRINE_ICD11_DOMAINS = {
  thyroid: "Thyroid gland and thyroid hormone system",
  diabetes: "Diabetes mellitus (including its acute complications)",
  glucose_other: "Other disorders of glucose regulation or pancreatic internal secretion",
  parathyroid: "Parathyroids and parathyroid hormone system",
  pituitary: "Pituitary hormone system",
  adrenal: "Adrenal glands and adrenal hormone system",
  gonadal: "Gonadal hormone system and puberty",
  polyglandular: "Polyglandular dysfunction and endocrine disorders NEC",
  nutrition: "Overweight, obesity and nutrient excess",
  electrolyte: "Fluid, electrolyte and acid-base balance",
  lipid: "Lipoprotein metabolism and lipidaemias",
  postprocedural: "Postprocedural endocrine disorders",
};

// code | official display term | domain | primary tabulation (1 = primary entry)
const RAW = [
  // ---- Thyroid gland and thyroid hormone system ----------------------------
  "5A00|Hypothyroidism|thyroid|1",
  "5A00.0|Congenital hypothyroidism|thyroid|1",
  "5A00.00|Permanent congenital hypothyroidism with diffuse goitre|thyroid|1",
  "5A00.01|Permanent congenital hypothyroidism without goitre|thyroid|1",
  "5A00.02|Pendred syndrome|thyroid|1",
  "5A00.03|Transient congenital hypothyroidism|thyroid|1",
  "5A00.04|Congenital hypothyroidism due to iodine deficiency|thyroid|1",
  "5A00.0Y|Other specified congenital hypothyroidism|thyroid|1",
  "5A00.0Z|Congenital hypothyroidism, unspecified|thyroid|1",
  "5A00.1|Iodine-deficiency-related thyroid disorders or allied conditions|thyroid|1",
  "5A00.10|Iodine-deficiency-related diffuse goitre|thyroid|1",
  "5A00.11|Iodine-deficiency-related multinodular goitre|thyroid|1",
  "5A00.1Z|Iodine-deficiency-related thyroid disorders or allied conditions, unspecified|thyroid|1",
  "5A00.2|Acquired hypothyroidism|thyroid|1",
  "5A00.20|Hypothyroidism due to medicaments or other exogenous substances|thyroid|1",
  "5A00.21|Myxoedema coma|thyroid|1",
  "5A00.22|Subclinical iodine-deficiency hypothyroidism|thyroid|1",
  "5A00.2Y|Other specified acquired hypothyroidism|thyroid|1",
  "5A00.2Z|Acquired hypothyroidism, unspecified|thyroid|1",
  "5A00.Z|Hypothyroidism, unspecified|thyroid|1",
  "5A01|Nontoxic goitre|thyroid|1",
  "5A01.0|Nontoxic diffuse goitre|thyroid|1",
  "5A01.1|Nontoxic single thyroid nodule|thyroid|1",
  "5A01.2|Nontoxic multinodular goitre|thyroid|1",
  "5A01.Z|Nontoxic goitre, unspecified|thyroid|1",
  "5A02|Thyrotoxicosis|thyroid|1",
  "5A02.0|Thyrotoxicosis with diffuse goitre|thyroid|1",
  "5A02.1|Thyrotoxicosis with toxic single thyroid nodule|thyroid|1",
  "5A02.2|Thyrotoxicosis with toxic multinodular goitre|thyroid|1",
  "5A02.3|Thyrotoxicosis from ectopic thyroid tissue|thyroid|1",
  "5A02.4|Thyrotoxicosis factitia|thyroid|1",
  "5A02.5|Thyroid crisis|thyroid|1",
  "5A02.6|Secondary hyperthyroidism|thyroid|1",
  "5A02.Y|Other specified thyrotoxicosis|thyroid|1",
  "5A02.Z|Thyrotoxicosis, unspecified|thyroid|1",
  "5A03|Thyroiditis|thyroid|1",
  "5A03.0|Acute thyroiditis|thyroid|1",
  "5A03.1|Subacute thyroiditis|thyroid|1",
  "5A03.2|Autoimmune thyroiditis|thyroid|1",
  "5A03.20|Hashimoto thyroiditis|thyroid|1",
  "5A03.21|Painless thyroiditis|thyroid|1",
  "5A03.2Y|Other specified autoimmune thyroiditis|thyroid|1",
  "5A03.2Z|Autoimmune thyroiditis, unspecified|thyroid|1",
  "5A03.Y|Other specified thyroiditis|thyroid|1",
  "5A03.Z|Thyroiditis, unspecified|thyroid|1",
  "5A04|Hypersecretion of calcitonin|thyroid|1",
  "5A05|Generalised resistance to thyroid hormone|thyroid|1",
  "5A06|Sick-euthyroid syndrome|thyroid|1",
  "5A0Y|Other specified disorders of the thyroid gland or thyroid hormones system|thyroid|1",
  "5A0Z|Disorders of the thyroid gland or thyroid hormones system, unspecified|thyroid|1",

  // ---- Diabetes mellitus ---------------------------------------------------
  "5A10|Type 1 diabetes mellitus|diabetes|1",
  "5A11|Type 2 diabetes mellitus|diabetes|1",
  "5A12|Malnutrition-related diabetes mellitus|diabetes|1",
  "5A13|Diabetes mellitus, other specified type|diabetes|1",
  "5A13.0|Diabetes mellitus due to genetic defects of beta cell function|diabetes|1",
  "5A13.1|Diabetes mellitus due to genetic defects in insulin action|diabetes|1",
  "5A13.2|Diabetes mellitus due to diseases of the exocrine pancreas|diabetes|1",
  "5A13.3|Diabetes mellitus due to endocrinopathies|diabetes|1",
  "5A13.4|Diabetes mellitus due to drug or chemical|diabetes|1",
  "5A13.5|Diabetes mellitus due to uncommon forms of immune-mediated diabetes|diabetes|1",
  "5A13.6|Diabetes mellitus due to other genetic syndromes|diabetes|1",
  "5A13.7|Diabetes mellitus due to clinically defined subtypes or syndromes|diabetes|1",
  "5A13.Y|Diabetes mellitus due to other specified cause|diabetes|1",
  "5A14|Diabetes mellitus, type unspecified|diabetes|1",
  "5A20|Diabetic hyperosmolar hyperglycaemic state|diabetes|0",
  "5A20.0|Hyperosmolar hyperglycaemic state without coma|diabetes|0",
  "5A20.1|Hyperosmolar hyperglycaemic state with coma|diabetes|0",
  "5A20.Z|Diabetic hyperosmolar hyperglycaemic state, unspecified|diabetes|0",
  "5A21|Hypoglycaemia in the context of diabetes mellitus|diabetes|0",
  "5A21.0|Hypoglycaemia in the context of diabetes mellitus without coma|diabetes|0",
  "5A21.1|Hypoglycaemia in the context of diabetes mellitus with coma|diabetes|0",
  "5A21.Z|Hypoglycaemia in the context of diabetes, unspecified|diabetes|0",
  "5A22|Diabetic acidosis|diabetes|0",
  "5A22.0|Diabetic ketoacidosis without coma|diabetes|0",
  "5A22.1|Diabetic lactic acidosis|diabetes|0",
  "5A22.2|Diabetic metabolic acidosis|diabetes|0",
  "5A22.3|Diabetic ketoacidosis with coma|diabetes|0",
  "5A22.Y|Other specified diabetic acidosis|diabetes|0",
  "5A22.Z|Diabetic acidosis, unspecified|diabetes|0",
  "5A23|Diabetic coma|diabetes|0",
  "5A24|Uncontrolled or unstable diabetes mellitus|diabetes|0",
  "5A2Y|Other specified acute complications of diabetes mellitus|diabetes|1",

  // ---- Other disorders of glucose regulation -------------------------------
  "5A40|Intermediate hyperglycaemia|glucose_other|1",
  "5A40.0|Impaired fasting glucose|glucose_other|1",
  "5A40.1|Impaired glucose tolerance|glucose_other|1",
  "5A40.Y|Other specified intermediate hyperglycaemia|glucose_other|1",
  "5A40.Z|Intermediate hyperglycaemia, unspecified|glucose_other|1",
  "5A41|Hypoglycaemia without associated diabetes|glucose_other|1",
  "5A42|Increased secretion of glucagon|glucose_other|1",
  "5A43|Abnormal secretion of gastrin|glucose_other|1",
  "5A43.0|Drug-induced hypergastrinaemia|glucose_other|1",
  "5A43.1|Zollinger-Ellison syndrome|glucose_other|1",
  "5A43.Y|Other specified abnormal secretion of gastrin|glucose_other|1",
  "5A43.Z|Abnormal secretion of gastrin, unspecified|glucose_other|1",
  "5A44|Insulin-resistance syndromes|glucose_other|0",
  "5A45|Persistent hyperinsulinaemic hypoglycaemia of infancy|glucose_other|1",
  "5A4Y|Other specified disorders of glucose regulation or pancreatic internal secretion|glucose_other|1",
  "5A4Z|Disorders of glucose regulation or pancreatic internal secretion, unspecified|glucose_other|1",

  // ---- Parathyroids --------------------------------------------------------
  "5A50|Hypoparathyroidism|parathyroid|1",
  "5A50.0|Hypoparathyroidism due to impaired parathyroid hormone secretion|parathyroid|1",
  "5A50.00|Idiopathic hypoparathyroidism|parathyroid|1",
  "5A50.01|Secondary hypoparathyroidism|parathyroid|1",
  "5A50.02|Hypoparathyroidism due to destruction of the parathyroid glands|parathyroid|1",
  "5A50.03|Autoimmune hypoparathyroidism|parathyroid|1",
  "5A50.0Y|Other specified hypoparathyroidism due to impaired parathyroid hormone secretion|parathyroid|1",
  "5A50.0Z|Hypoparathyroidism due to impaired parathyroid hormone secretion, unspecified|parathyroid|1",
  "5A50.1|Pseudohypoparathyroidism|parathyroid|1",
  "5A50.Y|Other specified hypoparathyroidism|parathyroid|1",
  "5A50.Z|Hypoparathyroidism, unspecified|parathyroid|1",
  "5A51|Hyperparathyroidism|parathyroid|1",
  "5A51.0|Primary hyperparathyroidism|parathyroid|1",
  "5A51.1|Secondary hyperparathyroidism|parathyroid|1",
  "5A51.2|Familial hypocalciuric hypercalcaemia|parathyroid|1",
  "5A51.Y|Other specified hyperparathyroidism|parathyroid|1",
  "5A51.Z|Hyperparathyroidism, unspecified|parathyroid|1",
  "5A5Y|Other specified disorders of the parathyroids or parathyroid hormone system|parathyroid|1",
  "5A5Z|Disorders of the parathyroids or parathyroid hormone system, unspecified|parathyroid|1",

  // ---- Pituitary hormone system --------------------------------------------
  "5A60|Hyperfunction of pituitary gland|pituitary|1",
  "5A60.0|Acromegaly or pituitary gigantism|pituitary|1",
  "5A60.1|Hyperprolactinaemia|pituitary|1",
  "5A60.2|Syndrome of inappropriate secretion of antidiuretic hormone|pituitary|1",
  "5A60.20|Nephrogenic syndrome of inappropriate antidiuresis|pituitary|1",
  "5A60.2Y|Other specified syndrome of inappropriate secretion of antidiuretic hormone|pituitary|1",
  "5A60.2Z|Syndrome of inappropriate secretion of antidiuretic hormone, unspecified|pituitary|1",
  "5A60.3|Central precocious puberty|pituitary|1",
  "5A60.Y|Other specified hyperfunction of pituitary gland|pituitary|1",
  "5A60.Z|Hyperfunction of pituitary gland, unspecified|pituitary|1",
  "5A61|Hypofunction or certain other specified disorders of pituitary gland|pituitary|1",
  "5A61.0|Hypopituitarism|pituitary|1",
  "5A61.1|Adrenocorticotropic hormone deficiency|pituitary|1",
  "5A61.2|Gonadotropin deficiency|pituitary|1",
  "5A61.3|Growth hormone deficiency|pituitary|1",
  "5A61.4|Thyroid stimulating hormone deficiency|pituitary|1",
  "5A61.40|Acquired central hypothyroidism|pituitary|1",
  "5A61.41|Congenital central hypothyroidism|pituitary|1",
  "5A61.4Y|Other specified thyroid stimulating hormone deficiency|pituitary|1",
  "5A61.4Z|Thyroid stimulating hormone deficiency, unspecified|pituitary|1",
  "5A61.5|Central diabetes insipidus|pituitary|1",
  "5A61.6|Oxytocin deficiency|pituitary|1",
  "5A61.Y|Other specified hypofunction or disorders of pituitary gland|pituitary|1",
  "5A6Z|Disorders of the pituitary hormone system, unspecified|pituitary|1",

  // ---- Adrenal glands ------------------------------------------------------
  "5A70|Cushing syndrome|adrenal|1",
  "5A70.0|Pituitary-dependent Cushing disease|adrenal|1",
  "5A70.1|Ectopic ACTH syndrome|adrenal|1",
  "5A70.2|Pseudo-Cushing syndrome|adrenal|1",
  "5A70.3|Nelson syndrome|adrenal|1",
  "5A70.Y|Other specified Cushing syndrome|adrenal|1",
  "5A70.Z|Cushing syndrome, unspecified|adrenal|1",
  "5A71|Adrenogenital disorders|adrenal|1",
  "5A71.0|46,XX disorders of sex development induced by androgens of fetal origin|adrenal|1",
  "5A71.00|Glucocorticoid resistance|adrenal|1",
  "5A71.01|Congenital adrenal hyperplasia|adrenal|1",
  "5A71.0Y|Other specified 46,XX disorders of sex development induced by androgens of fetal origin|adrenal|1",
  "5A71.0Z|46,XX disorders of sex development induced by androgens of fetal origin, unspecified|adrenal|1",
  "5A71.1|46,XX disorders of sex development induced by androgens of maternal origin|adrenal|1",
  "5A71.Y|Other specified adrenogenital disorders|adrenal|1",
  "5A71.Z|Adrenogenital disorders, unspecified|adrenal|1",
  "5A72|Hyperaldosteronism|adrenal|1",
  "5A72.0|Primary hyperaldosteronism|adrenal|1",
  "5A72.1|Secondary hyperaldosteronism|adrenal|1",
  "5A72.Z|Hyperaldosteronism, unspecified|adrenal|1",
  "5A73|Hypoaldosteronism|adrenal|1",
  "5A74|Adrenocortical insufficiency|adrenal|1",
  "5A74.0|Acquired adrenocortical insufficiency|adrenal|1",
  "5A74.1|Adrenal crisis|adrenal|1",
  "5A74.Y|Other specified adrenocortical insufficiency|adrenal|1",
  "5A74.Z|Adrenocortical insufficiency, unspecified|adrenal|1",
  "5A75|Adrenomedullary hyperfunction|adrenal|1",
  "5A76|Certain specified disorders of adrenal gland|adrenal|1",
  "5A76.0|Premature adrenarche|adrenal|1",
  "5A76.Y|Other specified disorders of adrenal gland|adrenal|1",
  "5A7Z|Disorders of the adrenal glands or adrenal hormone system, unspecified|adrenal|1",

  // ---- Gonadal hormone system and puberty ----------------------------------
  "5A80|Ovarian dysfunction|gonadal|1",
  "5A80.0|Clinical hyperandrogenism|gonadal|1",
  "5A80.1|Polycystic ovary syndrome|gonadal|1",
  "5A80.2|Polycystic ovary|gonadal|1",
  "5A80.3|Anovulation|gonadal|1",
  "5A80.4|Oligo-ovulation|gonadal|1",
  "5A80.5|Diminished ovarian reserve|gonadal|1",
  "5A80.Y|Other specified ovarian dysfunction|gonadal|1",
  "5A80.Z|Ovarian dysfunction, unspecified|gonadal|1",
  "5A81|Testicular dysfunction or testosterone-related disorders|gonadal|1",
  "5A81.0|Testicular hyperfunction|gonadal|1",
  "5A81.1|Testicular hypofunction|gonadal|1",
  "5A81.Y|Other specified testicular dysfunction or testosterone-related disorders|gonadal|1",
  "5A81.Z|Testicular dysfunction or testosterone-related disorders, unspecified|gonadal|1",
  "5A8Z|Disorders of the gonadal hormone system, unspecified|gonadal|1",
  "5A90|Disorder of puberty due to oestrogen resistance|gonadal|1",
  "5A91|Delayed puberty|gonadal|1",
  "5A92|Peripheral precocious puberty|gonadal|1",
  "5A9Y|Other disorders of puberty|gonadal|1",
  "5A9Z|Disorders of puberty, unspecified|gonadal|1",

  // ---- Polyglandular dysfunction and endocrine disorders NEC ---------------
  "5B00|Autoimmune polyendocrinopathy|polyglandular|1",
  "5B01|Polyglandular hyperfunction|polyglandular|1",
  "5B0Y|Other specified polyglandular dysfunction|polyglandular|1",
  "5B0Z|Polyglandular dysfunction, unspecified|polyglandular|1",
  "5B10|Carcinoid syndrome|polyglandular|1",
  "5B11|Short stature, not elsewhere classified|polyglandular|1",
  "5B12|Constitutional tall stature|polyglandular|1",

  // ---- Overweight, obesity and nutrient excess -----------------------------
  "5B80|Overweight or localised adiposity|nutrition|1",
  "5B80.0|Overweight|nutrition|1",
  "5B80.00|Overweight in infants, children or adolescents|nutrition|1",
  "5B80.01|Overweight in adults|nutrition|1",
  "5B80.0Z|Overweight, unspecified|nutrition|1",
  "5B80.1|Localised adiposity|nutrition|1",
  "5B81|Obesity|nutrition|1",
  "5B81.0|Obesity due to energy imbalance|nutrition|1",
  "5B81.00|Obesity in children or adolescents|nutrition|1",
  "5B81.01|Obesity in adults|nutrition|1",
  "5B81.1|Drug-induced obesity|nutrition|1",
  "5B81.Y|Other specified obesity|nutrition|1",
  "5B81.Z|Obesity, unspecified|nutrition|1",
  "5B90|Vitamin excesses|nutrition|1",
  "5B90.0|Hypervitaminosis A|nutrition|1",
  "5B90.1|Hypercarotenaemia|nutrition|1",
  "5B90.2|Hypervitaminosis D|nutrition|1",
  "5B90.3|Megavitamin-B6 syndrome|nutrition|1",
  "5B90.Y|Other specified vitamin excess|nutrition|1",
  "5B90.Z|Unspecified vitamin excesses|nutrition|1",
  "5B91|Mineral excesses|nutrition|1",
  "5B91.0|Hypercalcaemia|nutrition|1",
  "5B91.1|Zinc excess|nutrition|1",
  "5B91.2|Sodium chloride excess|nutrition|1",
  "5B91.3|Fluorine excess|nutrition|1",
  "5B91.4|Aluminium excess|nutrition|1",
  "5B91.5|Manganese excess|nutrition|1",
  "5B91.Y|Other specified mineral excess|nutrition|1",
  "5B91.Z|Unspecified mineral excess|nutrition|1",
  "5B9Y|Other specified nutrient excesses|nutrition|1",
  "5B9Z|Nutrient excesses, unspecified|nutrition|1",

  // ---- Fluid, electrolyte and acid-base balance ----------------------------
  "5C70|Volume depletion|electrolyte|1",
  "5C70.0|Dehydration|electrolyte|1",
  "5C70.1|Hypovolaemia|electrolyte|1",
  "5C70.Y|Other specified volume depletion|electrolyte|1",
  "5C70.Z|Volume depletion, unspecified|electrolyte|1",
  "5C71|Hyperosmolality or hypernatraemia|electrolyte|1",
  "5C72|Hypo-osmolality or hyponatraemia|electrolyte|1",
  "5C73|Acidosis|electrolyte|1",
  "5C73.0|Acute respiratory acidosis|electrolyte|1",
  "5C73.1|Chronic respiratory acidosis|electrolyte|1",
  "5C73.2|Anion gap metabolic acidosis|electrolyte|1",
  "5C73.Y|Other specified acidosis|electrolyte|1",
  "5C73.Z|Acidosis, unspecified|electrolyte|1",
  "5C74|Alkalosis|electrolyte|1",
  "5C75|Mixed disorder of acid-base balance|electrolyte|1",
  "5C76|Hyperkalaemia|electrolyte|1",
  "5C77|Hypokalaemia|electrolyte|1",
  "5C78|Fluid overload|electrolyte|1",
  "5C7Y|Other specified disorders of fluid, electrolyte or acid-base balance|electrolyte|1",
  "5C7Z|Disorders of fluid, electrolyte or acid-base balance, unspecified|electrolyte|1",

  // ---- Lipoprotein metabolism and lipidaemias ------------------------------
  "5C80|Hyperlipoproteinaemia|lipid|1",
  "5C80.0|Hypercholesterolaemia|lipid|1",
  "5C80.00|Primary hypercholesterolaemia|lipid|1",
  "5C80.01|Secondary hypercholesterolaemia|lipid|1",
  "5C80.0Z|Hypercholesterolaemia, unspecified|lipid|1",
  "5C80.1|Hypertriglyceridaemia|lipid|1",
  "5C80.2|Mixed hyperlipidaemia|lipid|1",
  "5C80.3|Hyperalphalipoproteinaemia|lipid|1",
  "5C80.Y|Other specified hyperlipoproteinaemia|lipid|1",
  "5C80.Z|Hyperlipoproteinaemia, unspecified|lipid|1",
  "5C81|Hypolipoproteinaemia|lipid|1",
  "5C81.0|Hypoalphalipoproteinaemia|lipid|1",
  "5C81.1|Hypobetalipoproteinaemia|lipid|1",
  "5C81.Y|Other specified hypolipoproteinaemia|lipid|1",
  "5C81.Z|Hypolipoproteinaemia, unspecified|lipid|1",
  "5C8Y|Other specified disorders of lipoprotein metabolism or lipidaemias|lipid|1",
  "5C8Z|Unspecified disorders of lipoprotein metabolism or lipidaemias|lipid|1",

  // ---- Postprocedural endocrine disorders ----------------------------------
  "5D40|Postprocedural hypothyroidism|postprocedural|1",
  "5D40.0|Postirridation hypothyroidism|postprocedural|1",
  "5D40.00|Hypothyroidism postradioactive iodine ablation|postprocedural|1",
  "5D40.0Y|Other specified postirridation hypothyroidism|postprocedural|1",
  "5D40.0Z|Postirridation hypothyroidism, unspecified|postprocedural|1",
  "5D40.Y|Other specified postprocedural hypothyroidism|postprocedural|1",
  "5D40.Z|Postprocedural hypothyroidism, unspecified|postprocedural|1",
  "5D41|Postprocedural hypoinsulinaemia|postprocedural|1",
  "5D42|Postprocedural hypoparathyroidism|postprocedural|1",
  "5D43|Postprocedural hypopituitarism|postprocedural|1",
  "5D44|Postprocedural ovarian failure|postprocedural|1",
  "5D45|Postprocedural testicular hypofunction|postprocedural|1",
  "5D46|Postprocedural adrenocortical hypofunction|postprocedural|1",
];

export const ENDOCRINE_ICD11 = RAW.map((line) => {
  const [code, display, domain, primary] = line.split("|");
  const domainLabel = ENDOCRINE_ICD11_DOMAINS[domain] || domain;
  const isPrimary = primary === "1";
  return {
    code,
    display,
    domain,
    domain_label: domainLabel,
    primary: isPrimary,
    system: ENDOCRINE_ICD11_MMS.system,
    system_uri: ENDOCRINE_ICD11_MMS.system_uri,
    release: ENDOCRINE_ICD11_MMS.release,
    version: `${ENDOCRINE_ICD11_MMS.label} ${ENDOCRINE_ICD11_MMS.release}`,
    source: ENDOCRINE_ICD11_MMS.source_url,
    browser: ENDOCRINE_ICD11_MMS.browser_url,
    verified_date: ENDOCRINE_ICD11_MMS.retrieved,
    precise: true,
    specificity: code.includes(".")
      ? "Subcategory — most specific"
      : "Block (stem) — select a subcategory when known",
    aliases: `${display} ${domainLabel}`,
    definition: isPrimary
      ? `WHO ICD-11 MMS category in ${domainLabel}. No inclusion or exclusion notes are reproduced — confirm the exact category against the WHO browser before relying on a residual (…Y / …Z) code.`
      : `WHO carries this as a NON-primary tabulation entry. Document it together with the diabetes type, never instead of it. Category in ${domainLabel}.`,
  };
});

// The catalogue a note offers: only the domains that note can code, so a
// thyroid note never suggests a diabetes code.
export const endocrineCatalogFor = (domains) => {
  const wanted = Array.isArray(domains) ? domains : [];
  if (!wanted.length) return ENDOCRINE_ICD11;
  return ENDOCRINE_ICD11.filter((i) => wanted.includes(i.domain));
};

export const ENDOCRINE_ICD11_COUNT = ENDOCRINE_ICD11.length;