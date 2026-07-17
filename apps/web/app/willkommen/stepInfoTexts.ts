// Info-Texte je Onboarding-Schritt. Wortlaut wie in der Produktabstimmung
// festgelegt. Wird von StepInfo (Callout + ⓘ) angezeigt. Konvention wie
// costTypeInfo.ts im NK-Wizard: Inhalte getrennt vom Layout.

export type StepInfo = { title: string; body: string };

export const STEP_INFO: Record<number, StepInfo> = {
  1: {
    title: "Deine Absenderdaten",
    body: "Diese Angaben erscheinen als Absender auf deinen Mahnungen, Abrechnungen und Dokumenten – einmal eintragen, überall verwendet.",
  },
  2: {
    title: "Dein erstes Objekt",
    body: "Ein Objekt ist ein Gebäude oder eine Adresse – z. B. dein Mehrfamilienhaus oder deine Eigentumswohnung. Einheiten legst du gleich darin an.",
  },
  3: {
    title: "Deine erste Einheit",
    body: "Eine Einheit ist eine einzelne Wohnung, ein Gewerbe oder ein Stellplatz. Die Wohnfläche brauchst du später für die Nebenkostenabrechnung – trag sie am besten gleich ein.",
  },
  4: {
    title: "Dein erstes Mietverhältnis",
    body: "Mit Kaltmiete, Vorauszahlungen und Fälligkeitstag erzeugt tefter automatisch jeden Monat die Soll-Stellung – so siehst du sofort, wer bezahlt hat und wer nicht.",
  },
};
