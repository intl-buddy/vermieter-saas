/** Häufige Fragen im Hilfebereich – die 10 wichtigsten aus der App-Praxis. */
export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    q: "Wie lege ich mein erstes Objekt an?",
    a: "Öffne „Objekte“ und klicke auf „Objekt anlegen“. Trag Adresse und Eckdaten ein und füge anschließend die Einheiten hinzu. Je Einheit legst du ein Mietverhältnis mit Mieter, Kaltmiete und Vorauszahlungen an. Die geführte Ersteinrichtung nimmt dich in rund 10 Minuten Schritt für Schritt an die Hand.",
  },
  {
    q: "Warum sehe ich keine offenen Posten?",
    a: "Offene Posten entstehen aus den monatlichen Soll-Stellungen. tefter erzeugt diese automatisch – aber erst, sobald ein Mietverhältnis angelegt ist, und jeweils zum Monatslauf ab dem Mietbeginn. Direkt nach dem Anlegen einer Einheit ist die Liste daher noch leer. Prüfe außerdem, ob beim Mietverhältnis eine Kaltmiete hinterlegt ist – ohne Soll-Betrag entsteht kein offener Posten.",
  },
  {
    q: "Wie funktioniert die Mahnung?",
    a: "Ist ein offener Posten überfällig, kannst du unter „Mieteingang“ beim betreffenden Mieter mit einem Klick eine Mahnung erzeugen. tefter kennt drei Stufen (Zahlungserinnerung, 2. Mahnung, letzte Mahnung) und erstellt jeweils ein fertiges PDF, das du herunterlädst oder direkt per E-Mail an den Mieter sendest. Die Stufe wird automatisch hochgezählt.",
  },
  {
    q: "Was brauche ich für die Nebenkostenabrechnung?",
    a: "Den Abrechnungszeitraum, deine Belege des Jahres (nach Kostenart erfasst), die passenden Umlageschlüssel je Kostenart und – bei Heizkosten – die Abrechnung deines Messdienstes. Der geführte Assistent führt dich in 7 Schritten durch die Abrechnung, verteilt bei Mieterwechsel tagesgenau und weist den Rechenweg sowie den § 35a-Betrag auf jedem PDF aus.",
  },
  {
    q: "Wie ändere ich Miete oder Vorauszahlungen?",
    a: "Öffne das Mietverhältnis der Einheit und passe Kaltmiete oder Vorauszahlungen an. Wichtig: Die Änderung gilt ab der nächsten Soll-Stellung – bereits erzeugte Soll-Stellungen vergangener Monate bleiben unverändert. Rückwirkende Korrekturen bildest du über eine entsprechende Zahlung bzw. Rückbuchung ab.",
  },
  {
    q: "Wie erfasse ich eine Mietminderung oder Rückbuchung?",
    a: "Erfasse beim betreffenden Mieter eine Zahlung mit negativem Betrag. So bildest du eine geplatzte Lastschrift (Rückbuchung) oder eine vereinbarte Mietminderung ab: Der offene Posten erhöht sich entsprechend und der Zahlungsverlauf bleibt lückenlos nachvollziehbar.",
  },
  {
    q: "Wie funktioniert das Übergabeprotokoll am Handy?",
    a: "Unter „Protokolle“ legst du ein Übergabeprotokoll für Einzug oder Auszug an. Du erfasst Räume und Zustände, Zählerstände und Schlüssel, fügst Fotos direkt vom Handy hinzu und lässt Vermieter und Mieter mit dem Finger auf dem Display unterschreiben. Das fertige Protokoll speicherst du als PDF und sendest es dem Mieter per E-Mail.",
  },
  {
    q: "Wie exportiere ich meine Daten?",
    a: "Unter „Einstellungen → Deine Daten“ erstellst du jederzeit einen vollständigen Export als ZIP-Archiv. Er enthält deine Objekte, Mietverhältnisse, Zahlungen, Belege und Dokumente – auch noch während der Lesephase nach Vertragsende.",
  },
  {
    q: "Wie kündige ich mein Abo und was passiert mit meinen Daten?",
    a: "Du kündigst jederzeit im Kundenportal (Einstellungen → Abo) zum Ende der Laufzeit. Danach wechselt dein Konto in den Lesemodus: Du behältst 6 Monate lang vollen Lesezugriff und kannst deine Daten exportieren, aber nichts mehr bearbeiten. Erst nach Ablauf dieser Frist werden deine Daten endgültig gelöscht.",
  },
  {
    q: "Warum weicht die EÜR vom Abrechnungsjahr ab?",
    a: "Die EÜR folgt dem steuerlichen Zufluss-/Abflussprinzip: Einnahmen und Ausgaben zählen in dem Jahr, in dem das Geld tatsächlich geflossen ist – nicht in dem Zeitraum, den sie betreffen. Eine im Januar gezahlte Dezembermiete oder eine Nebenkostennachzahlung fällt daher in ein anderes Jahr als in der periodengerechten Nebenkostenabrechnung. Deshalb können EÜR und Abrechnungsjahr voneinander abweichen.",
  },
];
