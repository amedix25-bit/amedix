import { sel, chk, multi, section } from "../shared";

export default {
  key: "ent",
  label: "ENT Examination",
  description: "Ear, nose, throat, oral cavity and neck",
  sections: [
    section("ear", "Ear", [
      sel("external_ear", "External ear / pinna", ["Normal", "Deformity", "Inflammation", "Discharge", "Scar"], { detailOn: ["Deformity", "Inflammation", "Discharge", "Scar"] }),
      chk("tragal_tenderness", "Tragal tenderness", { detailLaterality: true }),
      sel("ear_canal", "External auditory canal", ["Normal", "Wax", "Discharge", "Foreign body", "Swollen / narrowed"], { bilateral: true, detailOn: ["Discharge", "Foreign body", "Swollen / narrowed"] }),
      sel("tympanic_membrane", "Tympanic membrane", ["Normal, pearly grey", "Red / inflamed", "Retracted", "Perforated", "Fluid level"], { bilateral: true, detailOn: ["Red / inflamed", "Retracted", "Perforated", "Fluid level"] }),
      sel("hearing", "Hearing (whisper / voice test)", ["Normal", "Reduced"], { bilateral: true }),
      sel("tuning_fork", "Tuning fork tests (Rinne / Weber)", ["Normal", "Rinne negative", "Weber lateralized", "Not performed"], { detailLaterality: true }),
    ]),
    section("nose", "Nose and Sinuses", [
      sel("external_nose", "External nose", ["Normal", "Deformed", "Inflamed"], { detailOn: ["Deformed", "Inflamed"] }),
      sel("nasal_discharge", "Nasal discharge", ["None", "Clear", "Mucopurulent", "Blood-stained"], { detailOn: ["Mucopurulent", "Blood-stained"] }),
      sel("nasal_mucosa", "Nasal mucosa", ["Normal", "Hypertrophied turbinates", "Atrophic", "Inflamed"]),
      sel("septum", "Nasal septum", ["Central", "Deviated", "Perforated"], { detailOn: ["Deviated", "Perforated"], detailLaterality: true }),
      multi("sinus_tenderness", "Sinus tenderness", ["None", "Maxillary", "Frontal", "Ethmoidal"]),
    ]),
    section("throat", "Oral Cavity and Throat", [
      sel("lips", "Lips", ["Normal", "Fissured", "Cyanosed", "Ulcerated / lesion"], { detailOn: ["Fissured", "Ulcerated / lesion"] }),
      sel("oral_mucosa", "Oral mucosa", ["Normal", "Ulcerated", "White patch", "Pigmented", "Fungal infection"], { detailOn: ["Ulcerated", "White patch", "Pigmented", "Fungal infection"] }),
      sel("tongue", "Tongue", ["Normal", "Coated", "Ulcerated", "Deviated", "Atrophic"], { detailOn: ["Ulcerated", "Deviated", "Atrophic"], detailLaterality: true }),
      sel("teeth_gums", "Teeth and gums", ["Normal", "Caries", "Gingivitis", "Edentulous", "Poor dental hygiene"]),
      sel("tonsils", "Tonsils", ["Normal", "Enlarged"], { detailOn: ["Enlarged"] }),
      sel("pharynx", "Pharynx / post-nasal space", ["Normal", "Inflamed", "Post-nasal drip", "Lesion seen"], { detailOn: ["Inflamed", "Post-nasal drip", "Lesion seen"] }),
    ]),
    section("neck", "Neck", [
      multi("lymph_nodes", "Lymph nodes", ["None palpable", "Cervical", "Submandibular", "Submental", "Posterior triangle", "Supraclavicular"]),
      sel("node_details", "Node character", ["Not applicable", "Soft / tender", "Firm", "Rubbery", "Hard / fixed"], { detailOn: ["Firm", "Rubbery", "Hard / fixed"] }),
      sel("thyroid", "Thyroid", ["Normal", "Enlarged"], { detailOn: ["Enlarged"], detailLaterality: true }),
      sel("larynx", "Larynx / voice", ["Normal, voice clear", "Hoarse", "Stridor"], { detailOn: ["Hoarse", "Stridor"] }),
      sel("neck_movements", "Neck movements", ["Full", "Limited"], { detailOn: ["Limited"] }),
    ]),
    section("special_findings", "Special Findings", [], {
      abnormalFields: [],
      notesLabel: "Additional special findings / notes",
    }),
  ],
};