import { AR_FOUNDERS } from "./amedixStoryArabic";

// The founders' credit, in one place. These spellings are fixed: never
// translate, transliterate, re-spell, shorten or reorder them in either
// language. The Arabic names come from the official Arabic story text, so they
// are displayed exactly as they were provided.
export const FOUNDERS_EN = ["Ayatallah Abed Elallegy", "Mohammed Saad Alsaba"];
export const FOUNDERS_AR = AR_FOUNDERS;

export const foundersFor = (isArabic) => (isArabic ? FOUNDERS_AR : FOUNDERS_EN);