/**
 * Strukturierter, WÖRTLICHER Klauseltext des Wohnraummietvertrags. Automatisch
 * aus `templates/mietvertrag_volltext.txt` erzeugt (Absätze zusammengefügt) –
 * NICHT von Hand ändern; bei Änderung der Quelle neu generieren.
 */
export type MvSection = { num: number; title: string; paragraphs: string[] };

export const MV_SECTIONS: MvSection[] = [
  {
    "num": 1,
    "title": "Mietsache",
    "paragraphs": [
      "(1.1) Der Vermieter überlässt dem Mieter zu Wohnzwecken die Wohnung im Hause:",
      "Bruchstr. 96, 45468 Mülheim an der Ruhr, WE 1 Adresse, Lage (z.B. 1. OG links)",
      "Bestehend aus: 4 Zimmern, 1 Küche, 1 Bad, ____ Stellplätze / Garagen",
      "Der Standard der Mietsache entspricht, soweit nichts anderes vereinbart wurde, dem bei Fertigstellung des Gebäudes. Dies gilt insbesondere für den Schallschutz und die übrige Gebäudekonzeption. Die Angabe von Wohnungsgrößen, auch soweit sie vor Abschluss des Mietvertrages genannt wurden, dient wegen möglicher Messfehler nicht zur Festlegung der Mietsache. Der räumliche Umfang der gemieteten Sache ergibt sich vielmehr aus der Angabe der vermieteten Räume. Die Flächen von Balkonen, Loggien und Terrassen werden zur Hälfte angerechnet.",
      "(1.2) Zum Mitgebrauch sind folgende gemeinschaftlichen Anlagen und Einrichtungen vorhanden: Soweit Fahrradkeller, Waschküche und/oder sonstige zur gemeinschaftlichen Nutzung vorgesehene Räume überlassen werden, steht die Nutzung unter dem Vorbehalt der ausreichenden Kapazität für alle Mieter. Sollte es bei der Nutzung dieser Räume zu Problemen kommen, die auch unter Berücksichtigung des Gebots der Rücksichtnahme nicht unter den Mietern gelöst werden können, ist der Vermieter berechtigt, eine Benutzungsordnung aufzustellen."
    ]
  },
  {
    "num": 2,
    "title": "Mietdauer",
    "paragraphs": [
      "(2.1) Der Mietvertrag beginnt am 01.01.2024 und läuft auf unbestimmte Zeit.",
      "(2.2) Der Vertrag ist für beide Teile nach den gesetzlichen Regelungen unter Beachtung der gesetzlichen Kündigungsfristen kündbar."
    ]
  },
  {
    "num": 3,
    "title": "Wohnungsübergabe",
    "paragraphs": [
      "(3.1) Die Übergabe findet grundsätzlich in der Mietsache statt. Hierzu vereinbaren die Parteien einen Übergabetermin während der regelmäßigen Arbeitszeiten des Vermieters von 8.00 bis 17.00 Uhr am Tag des Beginns des Mietvertrages (§ 2.1). Liegt der Beginn des Mietvertrages an einem Samstag, Sonntag oder gesetzlichen Feiertag, findet die Übergabe am darauffolgenden Werktag statt, sofern die Parteien keinen anderen Zeitpunkt oder eine andere Form der Übergabe vereinbaren. Der Vermieter hat dem Mieter bei Besichtigung des Mietgegenstandes eine Kopie des Energieausweises im Sinne des § 16 Abs. 2 EnEV übergeben.",
      "(3.2) Bei der Übergabe hat der Mieter auf bestehende Mängel hinzuweisen. (3.3) Bei der Übergabe ist von den Parteien ein Protokoll zu fertigen, in dem der Zustand des Mietobjektes festgehalten wird. Die genaue Anzahl der ausgehändigten Schlüssel wird im Übergabeprotokoll dokumentiert. Der Vermieter wirkt bei der Beschaffung nachweislich erforderlicher weiterer Schlüssel mit. Die Kosten für solche Schlüssel trägt der Mieter.",
      "(3.4) Nimmt der Mieter die Mietsache schon vor Mietbeginn (§ 2.1) in Besitz, z. B. weil ihm die Schlüssel vom Vormieter überlassen wurden, hat er unverzüglich einen Übergabetermin gem. § 3.1 zu vereinbaren, sofern er aus dem Zustand der Mietsache Rechte herleiten will.",
      "(3.5) Der Mieter hat den Vermieter bei Einzug/Auszug bzw. Transport von sperrigen Gegenständen unter Nutzung der Gebäudeallgemeinflächen (Treppenhaus, Aufzüge, Flure, Empfang etc.) rechtzeitig zu informieren, um vor Beginn der Transporttätigkeiten eine förmliche Abnahme der Allgemeinflächen vorzunehmen. Nach Beendigung der Transporttätigkeit wird erneut eine Abnahme durchgeführt und ggfls. entstandene Schäden aufgenommen."
    ]
  },
  {
    "num": 4,
    "title": "Miete",
    "paragraphs": [
      "(4.1) Der Mieter leistet – vorbehaltlich einer Anpassung nach § 5 – an den Vermieter folgende monatliche Zahlungen:",
      "Grundmiete 920,00 EUR",
      "Betriebskostenvorauszahlung 200,00 EUR",
      "Heizkosten-/Warmwasservorauszahlung 180,00 EUR",
      "Stellplätze/Garagen (falls vereinbart und vorhanden) 0,00 EUR",
      "Gesamtmiete 1.300,00 EUR",
      "(4.2) Die Miete und ihre einzelnen Bestandteile können nach den gesetzlichen Bestimmungen geändert werden, soweit in diesem Vertrag nichts anderes geregelt ist. Bei preisgebundenem Wohnraum gilt die jeweils zulässige Miete als vertragliche Miete vereinbart.",
      "(4.3) Außerdem sind vom Mieter a) die Schönheitsreparaturen gem. § 15 auszuführen, b) die Kosten für Bagatellschäden (Kleinreparaturen) gem. § 16 bis zu einem Gesamtaufwand von 8% der Jahresgrundmiete zu tragen, c) die zur gemeinsamen Benutzung bestimmten Räume, Einrichtungen und Anlagen gem. § 14 zu reinigen, soweit nicht Vermieterleistung nach § 14 Abs. 3, d) die Schneebeseitigung und das Streuen bei Glatteisgefahr nach den Bestimmungen der jeweils gültigen Ortssatzung gem. § 14 durchzuführen, soweit nicht Vermieterleistung nach § 14 Abs. 3, e) die mitvermieteten Einrichtungsgegenstände und Warmwassergeräte (Gasetagenheizung, Durchlauferhitzer, Wäschetrockner, Elektroherd, Kühlschrank, Spül- und Waschmaschine etc.) gem. § 16 instand zu halten und durch geeignetes Fachpersonal zu warten, sofern die Kosten dafür jährlich nicht 4% der Jahresgrundmiete übersteigen, f) die mitvermieteten Warmwassergeräte (Durchlauferhitzer) und Gasetagenheizungen in der Wohnung jährlich einmal gem. § 16 durch einen Fachmann zu warten, sofern der Aufwand pro Jahr nicht 4% der Jahresgrundmiete übersteigt, weil diese Leistungen in der Miete gem. Abs. 1 nicht berücksichtigt sind."
    ]
  },
  {
    "num": 5,
    "title": "Zukünftige Mieterhöhungen",
    "paragraphs": [
      "( ) Staffelmiete",
      "(5.1) Die Grundmiete gem. § 4.1 wird als Staffelmiete vereinbart.",
      "(5.2) Folgende Staffeln für die Grundmiete werden vereinbart:",
      "Ab (Vertragsbeginn) ____________ ____________",
      "Ab ____________ ____________",
      "Ab ____________ ____________",
      "Ab ____________ ____________",
      "Ab ____________ ____________",
      "(5.3) Während der Laufzeit einer Staffelmiete ist eine Erhöhung nach den §§ 558–559b BGB ausgeschlossen. Bei einer längeren Mindestlaufzeit oder Befristung des Mietvertrages kann der Mieter zum Ablauf von 4 Jahren seit Abschluss der Staffelmietvereinbarung den Mietvertrag erstmals mit der gesetzlichen Frist kündigen. ( ) Indexmiete",
      "(5.1) Erhöht oder ermäßigt sich seit dem Vertragsbeginn der vom Statistischen Bundesamt herausgegebene Verbraucherpreisindex für Deutschland (Basisjahr 2020 = 100), so kann sich die Grundmiete gem. Abs. 2 im gleichen prozentualen Verhältnis erhöhen oder ermäßigen. Das gleiche gilt für jede erneute Änderung des Lebenshaltungskostenindex.",
      "(5.2) Eine Anpassung der Miete an die Änderung des Lebenshaltungskostenindex gem. Abs. 1 ist frühestens nach Ablauf von 12 Monaten seit Vertragsbeginn oder der letzten Änderung möglich. Die geänderte Miete ist vom Beginn des übernächsten Monats nach dem Zugang der Änderungserklärung des Vermieters oder Mieters zur Zahlung fällig. In der Erklärung, die in Textform abgegeben werden kann, ist die jeweils eingetretene Änderung des vereinbarten Index anzugeben.",
      "(5.3) Während der Geltungsdauer der Indexmiete gem. Abs. 1 ist eine Erhöhung der Miete nach § 558 BGB ausgeschlossen. § 559 BGB findet nur Anwendung bei baulichen Maßnahmen aufgrund von Umständen, die der Vermieter nicht zu vertreten hat.",
      "(X) Mieterhöhung nach § 558 BGB",
      "Zukünftige Mieterhöhungen richten sich nach den gesetzlichen Bestimmungen der §§ 558 ff. BGB."
    ]
  },
  {
    "num": 6,
    "title": "Betriebskosten",
    "paragraphs": [
      "(6.1) Neben der Grundmiete gem. § 4.1 trägt der Mieter die Betriebskosten im Sinne der §§ 1, 2 BetrKV (Betriebskostenverordnung). Die Betriebskostenverordnung ist als Anlage 1 beigefügt.",
      "(6.2) Über die Vorauszahlungen, die der Mieter gem. § 4.1 auf die im vorstehenden Absatz beschriebenen Betriebskosten leistet, rechnet der Vermieter jährlich ab. Für die Abrechnung gilt im Übrigen § 556 Abs. 3 BGB. Eine Zwischenablesung findet abweichend von den Vorgaben der Heizkostenverordnung (z.B. §§ 6a und 9b HeizkV) in allen Fällen nur auf besonderes Verlangen des Mieters statt. Durch diese Zwischenablesungen bedingte Kosten gehen zu Lasten des Mieters.",
      "(6.3) Mit der Betriebskostenabrechnung für die erste Abrechnungsperiode legt der Vermieter den Umlageschlüssel nach billigem Ermessen fest. Gehört die Mietsache zu einer Wirtschaftseinheit, kann der Vermieter den Umlageschlüssel auf die Wirtschaftseinheit beziehen. Gilt der Personenschlüssel, ist der Mieter verpflichtet, den Vermieter über jede relevante Änderung der Nutzer der Mietsache zu informieren. Relevant ist eine Änderung, sobald eine Person dauerhaft (= regelmäßig länger als drei Monate) die Mietsache nutzt oder sie verlässt. Der Vermieter ist berechtigt, bei Vorliegen sachlicher Gründe den Verteilerschlüssel für die nächste Abrechnungsperiode im Rahmen der gesetzlichen Vorschriften zu ändern. Ein Anspruch des Mieters entsteht insoweit nur nach den gesetzlichen Bestimmungen.",
      "(6.4) Neue Betriebskosten, deren Umlage auf den Mieter nach der BetrKV zulässig ist und die entweder unabhängig vom Willen des Vermieters oder nach einer Modernisierung entstehen oder zur ordnungsgemäßen Bewirtschaftung des Grundstücks erforderlich sind, darf der Vermieter umlegen, sofern er dem Mieter seine Absicht mit einer Frist von 1 Monat vor Beginn der Abrechnungsperiode mindestens in Textform mitgeteilt hat. In der Mitteilung sind die sachlichen Gründe für die Einführung und die geschätzten Kosten anzugeben. Den Umlageschlüssel setzt der Vermieter nach billigem Ermessen fest, sofern im laufenden Mietverhältnis ein Umlageschlüssel noch nicht festgelegt wurde. Der Vermieter ist berechtigt, durch die Erklärung nach Satz 1 (erhöhte) Vorauszahlungen in angemessener Höhe zum Beginn der Abrechnungsperiode zu verlangen.",
      "(6.5) Zieht der Mieter vor Ende der Abrechnungsperiode aus, wird eine Zwischenabrechnung nicht erteilt. Die Kosten einer Zwischenablesung und einer Nutzerwechselgebühr des Abrechnungsdienstes trägt der Mieter bei verbrauchsabhängigen Kosten. Ein Anspruch auf Rückzahlung der Vorauszahlungen wegen Abrechnungssäumigkeit nach Mietende besteht nicht, soweit die zugrundeliegenden Umstände nicht rechtskräftig festgestellt, entscheidungsreif oder unstreitig sind.",
      "(6.6) Zu den nach Abs. 1 umlegbaren Betriebskosten zählen insbesondere: laufende öffentliche Lasten des Grundstücks; Kosten der Wasserversorgung; Kosten der Entwässerung; Kosten des Betriebs der zentralen Heizungsanlage; Kosten der zentralen Warmwasserversorgungsanlage; Kosten des Betriebs des Personen- oder Lastenaufzugs; Kosten der Straßenreinigung; Kosten der Müllbeseitigung; Kosten der Gebäudereinigung; Kosten der Ungezieferbekämpfung; Kosten der Gartenpflege; Kosten der Beleuchtung und des Allgemeinstroms; Kosten der Schornsteinreinigung; Kosten der Sach- und Haftpflichtversicherung; Kosten für den Hauswart; Kosten der Gemeinschaftsantennenanlage oder eines Breitbandkabelanschlusses; Kosten des Betriebs der Einrichtung für die Wäschepflege; sonstige Betriebskosten, nämlich die Kosten der Dachrinnenreinigung, der wiederkehrenden Prüfungen von Elektroanlagen, Gasleitungen und sonstigen technischen Einrichtungen, der Wartung von Feuerlöschern, des Austausches von Leuchtmitteln bei natürlichem Verschleiß, der Wartung von Rauchabzugs-, Brandmelde- und Lüftungsanlagen, Rauchwarnmelder, der Bewachung bis zur Höhe von 8% der Jahresnettomiete, der Überprüfung und Wartung von Blitzschutzanlagen, der Wartung von Regelanlagen, der Wartung und des Betriebs (insbesondere Treibstoff) von Notstromanlagen, laufende Untersuchungen nach § 14 TrinkwV, der Reinigung und des Betriebs (Strom, Wasser, Wartung von Pumpen) von Springbrunnen- oder Teichanlagen.",
      "(6.7) Die Heizkosten, auf die der Mieter gem. § 4 Abs. 1 Vorauszahlungen leistet, werden im Verhältnis von 70 % nach Verbrauch und 30 % nach Grundkosten umgelegt.",
      "(6.8) Ein Anspruch auf unentgeltliche Bescheinigung der haushaltsnahen Dienstleistungen besteht nicht."
    ]
  },
  {
    "num": 7,
    "title": "Mietzahlungen",
    "paragraphs": [
      "(7.1) Die Miete nach § 4.1 ist monatlich im Voraus, spätestens bis zum 3. Werktag eines jeden Monats kostenfrei nach näherer Bestimmung des Vermieters zu entrichten. Für die Rechtzeitigkeit der Zahlung ist der Eingang auf dem Konto des Vermieters maßgeblich.",
      "Kontoinhaber: Max Mustermann",
      "IBAN: DE12 3655 0000 0053 2350 73",
      "Kautionskonto:",
      "Kontoinhaber: Max Mustermann",
      "IBAN: DE12 3655 0000 0053 2350 73",
      "(7.2) Der Mieter ist auf Verlangen des Vermieters verpflichtet, die Miete und die sonstigen Entgelte von einem Konto bei einem Geldinstitut einziehen zu lassen (Lastschrifteinzugsverfahren) und die dazu in Anlage 2 erforderliche Einzugsermächtigung zu erteilen. Der Mieter hat ggf. ein Konto bei einem Geldinstitut anzulegen und für die Deckung des Kontos in Höhe der monatlich zu leistenden laufenden Zahlung zu sorgen. Wurden Lastschriften zweimal hintereinander nicht eingelöst, kann der Vermieter durch Erklärung in Textform die Pflicht zum Lastschrifteinzug für die Folgezeit zeitlich beschränkt aussetzen, so dass der Mieter zum nächsten Fälligkeitstermin die Miete selbst zu überweisen hat, sofern die Erklärung bis zum 20. des laufenden Monats beim Mieter eingeht. Im Übrigen besteht auch für den Vermieter das Recht zur fristlosen Kündigung der Lastschriftvereinbarung aus wichtigem Grund. Bei Vorliegen eines wichtigen Grundes ist auch der Mieter berechtigt, die Einzugsermächtigung zu widerrufen.",
      "(7.3) Bei Zahlungsverzug darf der Vermieter die gesetzlichen Verzugszinsen und für jede schriftliche Mahnung pauschalierte Mahnkosten berechnen, sofern der Mieter nicht nachweist, dass geringere Kosten entstanden sind. Aus mehrfach verspäteten Mietzahlungen kann der Mieter keine Rechte herleiten.",
      "(7.4) Zahlungen, für die der Mieter keine Tilgungsbestimmung trifft, werden zunächst auf die Betriebskostenvorauszahlungen und sodann gem. §§ 366, 367 BGB verrechnet."
    ]
  },
  {
    "num": 8,
    "title": "Sicherheitsleistung",
    "paragraphs": [
      "(8.1) Der Mieter hinterlegt eine Barkaution in Höhe von 1.800,00 EUR (zwei Kaltmieten). Diese dient der Sicherung der Forderungen des Vermieters aus dem Mietvertrag. Bei öffentlich gefördertem Wohnungsbau dient die Kaution allein zur Sicherung der Ansprüche des Vermieters aus Schäden an der Wohnung und unterlassenen Schönheitsreparaturen. Die Zahlung erfolgt nach den gesetzlichen Bestimmungen getrennt von der laufenden Mietzahlung auf das in § 7.1 genannte Konto, sofern der Vermieter nicht ein anderes Konto für die Zahlung der Mietsicherheit benennt.",
      "(8.2) Für die Verwahrung der Mietsicherheit gelten die gesetzlichen Vorschriften. Der Mieter trägt die Gebühren, die das Kreditinstitut für die Anlage der Kaution erhebt. Bei Abzug von Kapitalertragssteuer durch das Kreditinstitut ist der Vermieter berechtigt, die Vorlage der Steuerbescheinigung über den Abzug der Kapitalertragssteuer von der Zahlung des als Steuer abgezogenen Betrages auf das Kautionskonto abhängig zu machen.",
      "(8.3) Sofern eine Mieterhöhung gemäß den §§ 557–559b BGB erfolgt ist, kann der Vermieter eine entsprechende Aufstockung der Mietsicherheit in Textform verlangen, sofern sich die Nettokaltmiete um mehr als 10 % erhöht hat. Der Erhöhungsbetrag ist fällig zum Beginn des dritten Monats, der auf den Zugang der Erklärung des Vermieters folgt. (8.4) Bei Fälligkeit des Kautionsrückzahlungsanspruchs obliegt es dem Vermieter, zu entscheiden, ob und mit welchen seiner Forderungen eine Verrechnung erfolgt. Die vorbehaltlose Auszahlung der Mietsicherheit an den Mieter stellt jedenfalls keinen Verzicht auf eigene Forderungen des Mieters dar.",
      "(8.5) Bei einer Personenmehrheit auf Mieterseite ist der Vermieter auch zur Verrechnung der Mietsicherheit mit Forderungen berechtigt, die nur gegen einen von mehreren Mietern bestehen, sofern die Forderung aus dem Mietverhältnis resultiert.",
      "(8.6) Weiter bestehen keine Aufrechnungsverbote zu Lasten des Vermieters, auch nicht wegen kautionsfremder Ansprüche.",
      "(8.7) Der Mieter ist berechtigt, bis zwei Wochen vor Mietvertragsbeginn anstatt der Barkaution die selbstschuldnerische Bürgschaft einer Bank oder Versicherung, die sich am Einlagensicherungsfonds beteiligt hat, als Mietsicherheit vorzulegen. Sie muss der Schriftform gemäß § 766 BGB genügen. Die Bürgschaft muss selbstschuldnerisch, unwiderruflich, unbefristet und unbedingt sein. Die Ziffern 8.3 bis 8.5 sind entsprechend anwendbar."
    ]
  },
  {
    "num": 9,
    "title": "Gewährleistung und Haftung des Vermieters",
    "paragraphs": [
      "(9.1) Der Vermieter haftet vorbehaltlich § 9.2 nur für schuldhaft verursachte Mängel.",
      "(9.2) Die Haftung des Vermieters setzt grundsätzlich grobe Fahrlässigkeit oder Vorsatz voraus, soweit sie sich nicht auf Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, die auf einer fahrlässigen Pflichtverletzung des Vermieters oder einer vorsätzlichen oder fahrlässigen Pflichtverletzung eines gesetzlichen Vertreters oder Erfüllungsgehilfen des Vermieters beruhen. Führt ein Mangel des Mietobjektes zu Sach- oder Vermögensschäden des Mieters, haftet der Vermieter nur bei Vorsatz oder grober Fahrlässigkeit, wenn er selbst keinen Ersatz von einem Dritten (z.B. Versicherer) verlangen kann und sich ein vertragsuntypisches Risiko (z.B. Einlagerung wertvoller Sachen) realisiert. Zum Abschluss einer Haus- und Grundeigentümerhaftpflichtversicherung, deren Kosten nach § 6 umgelegt werden, ist der Vermieter verpflichtet.",
      "(9.3) Der vertragsgemäße Zustand richtet sich grundsätzlich nach dem Jahr der Bezugsfertigkeit des Gebäudes."
    ]
  },
  {
    "num": 10,
    "title": "Benutzung der gemeinschaftlichen Anlagen und Einrichtungen, Abfallentsorgung",
    "paragraphs": [
      "(10.1) Für ein gedeihliches Zusammenleben im Mietobjekt ist vor allem die Beachtung des Gebots der Rücksichtnahme erforderlich. Die Regeln, die für ein geordnetes und reibungsloses Zusammenleben in der Hausgemeinschaft zu beachten sind, sind in der Hausordnung bestimmt, die diesem Vertrag als Anlage 3 beigeheftet ist. Diese Regeln hat der Mieter zu beachten und die vorgegebenen Zeiten einzuhalten.",
      "(10.2) Die Hausordnung und die Benutzungsordnungen für vorhandene Einrichtungen darf der Vermieter auch nachträglich aufstellen und/oder ändern, soweit dies im Interesse einer ordnungsgemäßen Bewirtschaftung des Hauses dringend notwendig und für den Mieter zumutbar ist, § 315 BGB. Neue oder geänderte Regelungen werden dem Mieter schriftlich mitgeteilt und wirken für den Beginn des übernächsten Monats, der auf den Zugang der Erklärung folgt. In der Erklärung hat der Vermieter die sachlichen Gründe anzuführen.",
      "(10.3) Für die Versorgung mit Energie (Elektrizität, Gas, Wasser) zum privaten Gebrauch schließt der Mieter mit einem Versorgungsunternehmen selbständige Lieferverträge ab, soweit dafür die technischen Voraussetzungen im Gebäude vorhanden sind.",
      "(10.4) Der Mieter hat die in der Mietsache vorhandenen Abfallentsorgungseinrichtungen zu benutzen. Der Vermieter ist berechtigt, die eingerichtete Abfallentsorgung zu ändern, sofern sie durch die Gemeinde oder das Entsorgungsunternehmen anders geregelt wird, dies aus Gründen des Umweltschutzes gerechtfertigt ist oder vernünftige Gründe für die Änderung vorliegen, § 315 BGB. Der Vermieter wird eine Änderung dem Mieter schriftlich mitteilen. Die Änderung wirkt auf den Beginn des übernächsten Monats, der auf den Zugang der Mitteilung folgt. In der Erklärung sind die sachlichen Gründe anzuführen.",
      "(10.5) Die gemeinschaftlichen Flächen und Einrichtungen auf dem Grundstück, insbesondere auch die Zuwege, nutzt der Mieter so, dass kein anderer Benutzer mehr als unvermeidbar beeinträchtigt wird. Er fährt auf den Fahrwegen nur mit Schritttempo und beachtet die für den Straßenverkehr geltenden Vorschriften. Das Parken oder Abstellen des Fahrzeuges auf dem übrigen Grundstück ist nicht gestattet. (10.6) Der Mieter hat Lärmbelästigungen, insbesondere durch Hupen und Laufenlassen des Motors sowie lautes Schlagen von Fahrzeugtüren, Motorhaube und Kofferraumdeckel, Anfahren mit unnötig hoher Motordrehzahl sowie lautes Radio-/Musikhören bei heruntergelassenen Seitenscheiben zu vermeiden. Rauchen und das Verwenden von offenem Feuer, die Vornahme von Reparaturarbeiten am Fahrzeug und das Wechseln und Ablassen von Öl und anderen Betriebsstoffen, die Lagerung jeglicher Gegenstände, insbesondere von Brennstoffen, ist verboten. Gleiches gilt für das Wagenwaschen einschließlich Motorraum- und Unterbodenwäsche und die Wasserentnahme auf dem Grundstück.",
      "(10.7) Das Abstellen von unangemeldeten Fahrzeugen oder Schrottfahrzeugen auf dem Stellplatz ist nicht gestattet. Das Gleiche gilt für das Abstellen von Wohnwagen und Wohnmobilen und anderer Gegenstände (z.B. Sperrmüll, Reifen, sonstiges Kraftfahrzeugzubehör).",
      "(10.8) Der Mieter hat Beschädigungen an den Flächen usw. sowie Schäden, die durch ausgelaufenen Kraftstoff, Öl oder Säure entstanden sind, unverzüglich zu beseitigen. Soweit der Boden der Mietsache beschädigt ist, muss eine Erneuerung erfolgen.",
      "(10.9) Der Mieter hat die polizeilichen Bestimmungen für die Benutzung von Garagen und Kfz-Abstellplätzen zu beachten. Insbesondere dürfen weder Treibstoffe noch leere Treibstoffbehälter gelagert werden."
    ]
  },
  {
    "num": 11,
    "title": "Benutzung der Mietsache, Obhuts- und Reinigungspflichten",
    "paragraphs": [
      "(11.1) Der Mieter hat die Nutzung der Mieträume so einzurichten, dass der in § 1 festgelegte Zweck nicht beeinträchtigt wird. Einen vom Nutzungszweck abweichenden Gebrauch hat der Mieter auch dann anzuzeigen, wenn sie untergeordneter Natur sind (vgl. dazu § 13.1 lit. b). Auch in diesem Fall ist der Vermieter mit einer stillschweigenden Änderung des Nutzungszwecks nicht einverstanden, sofern nicht ausdrücklich eine andere Vereinbarung getroffen wird.",
      "(11.2) Der Mieter hat die Mietsache schonend und pfleglich zu behandeln. Seine Reinigungspflicht bezieht sich auch auf Außenwände im Bereich der Wohnung, Balkone und Balkonverkleidungen, soweit Verschmutzungen durch den Mieter herbeigeführt wurden (z.B. herunterlaufendes Seifenwasser beim Fensterreinigen etc.).",
      "(11.3) In die Spülsteine, Ausgussbecken und Aborte dürfen Abfall, Asche, schädliche Flüssigkeiten und ähnliches nicht eingebracht werden. Mieter, die eine Verstopfung der Abflussleitungen verursachen, haben die Kosten zur Beseitigung der Verstopfung und evtl. Nachfolgeschäden zu tragen. Die Abflussbecken sind nicht zum Abstellen von Eimern, Waschfässern oder sonstigen Behältnissen aus Materialien, die die Oberfläche (insbesondere Emaille) beschädigen könnten, zu verwenden.",
      "(11.4) Der Bodenbelag ist mitvermietet. Er ist regelmäßig sachgerecht zu reinigen. Teppichböden sind fachgerecht zu reinigen (schamponieren), sobald dies erforderlich ist.",
      "(11.5) Die Wohnung ist ganzjährig vom Mieter ausreichend zu lüften. Der Mieter ist verpflichtet, die in Anlage 4 beigefügten Allgemeinen Hinweise zur Belüftung und Beheizung und Spülen der Trinkwasserleitungen zu beachten. Der Lüftungsvorgang muss wenigstens zweimal täglich erfolgen. Das Lüften erfordert das Öffnen der Fensterflügel (sog. Stoßlüften). Sofern möglich, ist quer zu lüften. Kann die Querlüftung wegen der Raumaufteilung der Wohnung nicht erfolgen, ist übereck zu lüften. Das Kippen der Fensterflügel ist in keinem Fall ausreichend. Es kann ein Lüften gem. vorstehendem Absatz nicht ersetzen. Je stärker der Raum benutzt wird oder je geringer die Raumtemperaturen sind, desto länger muss der Lüftungsvorgang erfolgen. Ein Lüftungsvorgang, der kürzer als 5 Minuten dauert, ist grundsätzlich nicht ausreichend. Treten kurzzeitig größere Dampfmengen auf, so sind diese unverzüglich nach außen durch Lüften wie im vorstehenden Absatz beschrieben, abzuleiten. Eine Vergrößerung der Luftfeuchtigkeit über das normale Maß hinaus tritt insbesondere beim Baden, Duschen, Wäschetrocknen oder der Benutzung eines Ablufttrockners ein. Sind im Mietobjekt für das Wäschetrocknen besondere Räume vorhanden, sollen diese grundsätzlich benutzt werden. Im Übrigen gilt die im vorstehenden Absatz für das kurzzeitige Auftreten größerer Dampfmengen beschriebene Lüftungsweise. Bei der Möblierung der Zimmer kann es erforderlich sein, darauf zu achten, dass Möbel und andere Einrichtungsgegenstände nicht zu dicht an den Wänden stehen, um die erforderliche Raumluftzirkulation nicht zu behindern. Der Mindestabstand zwischen der Wand und einem Möbelstück sollte 5 cm nicht unterschreiten. Sollte im Einzelfall ein größerer Abstand erforderlich sein, was insbesondere beim Aufstellen von Möbeln an Außenwänden möglich ist, gilt dieser Abstand als vertraglich vereinbart. Werden an den Außenwänden Bilder, Teppiche, Wandbehänge usw. angebracht, ist durch geeignete Maßnahmen (schräg aufhängen, Abstandhalter usw.) für eine Hinterlüftung zu sorgen.",
      "(11.6) Das Beheizen der Wohnung muss so erfolgen, dass die Raumtemperatur auch im Außenwand- bzw. Eckbereich ausreichend ist. Der Mieter ist verpflichtet, die in Anlage 4 beigefügten Allgemeinen Hinweise zur Belüftung und Beheizung und Spülen der Trinkwasserleitungen zu beachten. Die einzuhaltenden Innentemperaturen für beheizte Räume in Wohnhäusern (Norm-Innentemperaturen nach DIN 4701) betragen vorbehaltlich der Nachtabsenkung (3° C): Wohn- und Schlafräume, Küche und WC + 20° C; Bäder + 22° C; beheizte Nebenräume (Vorräume, Flure) + 15° C. Werden diese Temperaturen unterschritten, ist ein verstärktes Lüften wie unter § 11.5 Abs. 2 angegeben erforderlich. Sinkt die Außentemperatur unter den Gefrierpunkt, sind alle geeigneten Maßnahmen zu treffen, um ein Einfrieren der sanitären Anlagen zu vermeiden. Ergänzend gelten die zur Frostgefahr in der als Anlage 3 beigefügten Hausordnung aufgestellten Regeln."
    ]
  },
  {
    "num": 12,
    "title": "Anzeigepflichtige Handlungen des Mieters",
    "paragraphs": [
      "(12.1) Der Mieter hat dem Vermieter anzuzeigen, wenn er mehrere Haushaltsgeräte (Waschmaschinen, Wäschetrockner, Geschirrspülmaschinen etc.) gleichzeitig in der Mietsache aufstellen und betreiben will. Ein Anspruch auf Erweiterung der vorhandenen Elektro-Unterverteilung besteht nicht.",
      "(12.2) Waschmaschinen sind – soweit vorhanden – in der Waschküche aufzustellen. Beim Betrieb eines Ablufttrockners in der Wohnung ist § 11.6 zu beachten. Grundsätzlich ist der Schlauch des Ablufttrockners nach außen zu führen (z.B. durch geöffnetes Fenster).",
      "(12.3) Der Vermieter kann dem Mieter im Einzelfall Beschränkungen für den Betrieb von Haushaltsgeräten auferlegen, wenn dies aus technischen Gründen, zum Schutze der Mietsache oder aus dem Gebot der Rücksichtnahme gerechtfertigt ist."
    ]
  },
  {
    "num": 13,
    "title": "Erlaubnisvorbehalte zum vertragsgemäßen Gebrauch",
    "paragraphs": [
      "(13.1) Mit Rücksicht auf die Gesamtheit der Mieter sowie im Interesse einer ordnungsgemäßen Bewirtschaftung des Hauses und der Wohnung bedarf der Mieter der vorherigen Zustimmung des Vermieters (beachte Abs. 7), wenn er a. die Wohnung oder einzelne Räume entgeltlich oder unentgeltlich Dritten überlässt, es sei denn, es handelt sich um eine unentgeltliche vorübergehende Aufnahme Dritter (Besuch), (beachte Abs. 3); b. die Wohnung oder einzelne Räume zu anderen als Wohnzwecken benutzt oder benutzen lässt, soweit es sich nicht um eine untergeordnete anderweitige Nutzung im Sinne von § 11.1 handelt; c. Schilder, Aufschriften oder Gegenstände jeglicher Art in gemeinschaftlichen Räumen oder am Mietobjekt anbringt bzw. auf dem Grundstück aufstellt. Hiervon ausgenommen sind die üblichen Namensschilder des Mieters an den dafür vorgesehenen Stellen (Klingelschild, Briefkasten etc.), die allerdings in einheitlicher Form erstellt werden sollten. Diese sind außerdem bei Änderungen des Namens, z.B. infolge Heirat oder genehmigter Untervermietung stets zu aktualisieren; d. Tiere hält oder in Pflege nimmt oder aus sonstigen Gründen nicht nur vorübergehend in die genutzten Räume aufnimmt; dies gilt nicht für sog. Kleintiere (Zierfische, Kanarienvögel, Schildkröten etc.), die in den üblichen Grenzen gehalten werden; e. Antennen (Satellitenanlagen) anbringt oder verändert (beachte hierzu § 13.4); f. in den Mieträumen, im Mietobjekt oder auf dem Grundstück außerhalb ausgewiesener allgemeiner Park-, Einstell- oder Abstellplätze ein Kraftfahrzeug, einschließlich Moped oder Mofa abstellen will; g. Veränderungen der Mietsache vornimmt, die über den normalen Wohngebrauch hinausgehen (beachte hierzu Abs. 5 u. 6); dazu gehören insbesondere Maßnahmen zur Veränderung der Raumaufteilung, ein Abweichen von der nach dem Vertrag vorgesehenen Beheizungsart, das vollflächige Verkleben von Teppichboden, Verlegen von Laminat oder Parkett und die Installation von Deckenplatten; h. weitere Schlüssel zu einer Zentralschließanlage anfertigen lassen will (beachte Abs. 7).",
      "(13.2) Die Zustimmung nach § 13.1 muss vor Beginn der Handlung eingeholt werden und ist schriftlich zu erteilen. Mit der Zustimmung kann der Vermieter sachliche Beschränkungen und sonstige Auflagen, die im Einzelfall notwendig sind, verbinden. Der Vermieter kann eine erteilte Zustimmung widerrufen, wenn Auflagen nicht eingehalten, Bewohner, Haus oder Grundstück gefährdet oder beeinträchtigt oder Nachbarn belästigt werden oder sich Umstände ergeben, unter denen eine Zustimmung nicht mehr erteilt werden könnte, oder ein sonstiger wichtiger Grund vorliegt.",
      "(13.3) Im Falle der Untervermietung oder sonstigen (teilweisen) Gebrauchsüberlassung an Dritte hat der Mieter mit dem Gesuch um Zustimmung neben dem vollständigen Namen des Dritten dessen Beruf, letzte Anschrift und Geburtsdatum anzugeben. Der Vermieter ist berechtigt, weitere Umstände zu erfragen, soweit sie für seine Entscheidung relevant sind.",
      "(13.4) Soweit und solange für die besonderen schützenswerten Belange des ausländischen Mieters, die höher einzustufen sind als das Interesse des Vermieters an der unbeschädigten Erhaltung oder dem einheitlichen Erscheinungsbild seiner Immobilie, kein ausreichender Rundfunk- und Fernsehempfang möglich ist, wird dem Mieter die Anbringung einer einzelnen Empfangsanlage (z.B. Satellitenschüssel) außerhalb der Mieträume auf Anfrage gestattet, soweit eine technische Nachrüstung der vorhandenen Anlage die Behebung des Defizits ausgeschlossen ist. Die Anbringung hat im Einvernehmen mit dem Vermieter unter Beachtung der VDI und der behördlichen Vorschriften fachmännisch zu erfolgen. Wenn nachträglich eine ausreichende Gemeinschaftsempfangsanlage eingerichtet wird, hat der Mieter die Antenne auf seine Kosten zu entfernen und den alten Zustand wiederherzustellen, sofern dies in der Erlaubnis vorbehalten wurde. Eine Zustimmung zur Installation von Sende- und Funkantennen wird nur bei Vorliegen besonderer Gründe erteilt, die eine Ausnahme vom grundsätzlichen Verbot der Installation derartiger Antennen gebietet. Der Vermieter kann die Zustimmung in den hier geregelten Fällen von der Leistung einer zusätzlichen Sicherheit in Höhe der ungefähren Rückbaukosten sowie die versicherungsmäßig abgedeckte Freistellung von Ansprüchen Dritter wegen Schäden aufgrund einer installierten Empfangsanlage abhängig machen. Die Sicherheit ist nach den gesetzlichen Bestimmungen anzulegen.",
      "(13.5) Veränderungen der Mietsache sind alle Um-, An- und Einbauten sowie Installationen, die die Mieträume, Anlagen oder Einrichtungen des Vermieters verändern. Von dem normalen Wohngebrauch werden erfasst die Hilfsmaßnahmen bei der Einrichtung und Ausstattung der Räume (z.B. Bildernägel, Dübel) im notwendigen Umfang, Einrichtungsmaßnahmen (Raumteiler, Einbauküche) und notwendige Verwendungen. Hierher gehören weiter kleine Substanzeingriffe ohne Dauerfolgen für das Mietgebäude, sofern die Eingriffe dem Einrichten der Wohnung näher als einer baulichen Maßnahme stehen. Für bauliche Veränderungen, die über das beschriebene Maß hinausgehen, steht die Zustimmung des Vermieters in seinem freien Ermessen, sofern es sich nicht um eine Maßnahme zur Herbeiführung eines barrierefreien Wohnens i.S.v. § 554a BGB handelt. Er kann in diesem Fall die Zustimmung insbesondere von der Leistung einer zusätzlichen Sicherheit in Höhe der ungefähren Rückbaukosten verlangen. Die Sicherheit ist nach den gesetzlichen Bestimmungen anzulegen.",
      "(13.6) Für Veränderungen der Mietsache und sonstige Maßnahmen des Mieters entsteht nur dann eine Gewährleistungspflicht des Vermieters, wenn er vom Einbau Kenntnis erhalten hat und Eigentümer der Teile geworden ist, er seine Verpflichtung ausdrücklich übernommen hat oder mit seiner Zustimmung Teile der Mietsache fachmännisch ersetzt werden.",
      "(13.7) Der Vermieter kann die Zustimmung zur Anfertigung weiterer Schlüssel zu einer Zentralschließanlage nicht verweigern, wenn der Mieter ein berechtigtes Interesse an der Überlassung eines oder mehrerer zusätzlicher Schlüssel hat. Ein berechtigtes Interesse ist insbesondere gegeben, wenn der Mieter den Schlüssel für andere Mitbewohner benötigt, die sich berechtigterweise in der Wohnung aufhalten."
    ]
  },
  {
    "num": 14,
    "title": "Reinigungs- und Streupflicht allgemeiner Teile",
    "paragraphs": [
      "(14.1) Dem Mieter obliegt die Gehwegreinigung, die Räum- und Streupflicht nach den Vorgaben der gültigen Ortssatzung der jeweiligen Gemeinde sowie die Ergreifung von Schutzmaßnahmen bei Unwetter und Frost. Zu Beginn jeden Kalenderjahres legt der Vermieter den wöchentlichen Turnus fest, nach dem diese allgemeine Reinigungspflicht von den Mietern im Hause durchzuführen ist. Der Turnus bezieht sich auf einen Zeitraum von montags bis sonntags. Alter oder Gebrechlichkeit entbinden einen Mieter nicht von der Erfüllung dieser Verpflichtung. Bei Ortsabwesenheit hat der Mieter für eine Vertretung zu sorgen. Jeder Mieter ist zur nachbarschaftlichen Hilfe aufgerufen.",
      "(14.2) Die regelmäßige Reinigung des Treppenhauses einschließlich der Treppenhausfenster obliegt dem Mieter im Wechsel mit den anderen Mietern des Objektes. Grundsätzlich hat jeder Mieter die zu seiner Etage führende Treppe einschließlich der Podeste einmal wöchentlich feucht zu reinigen. Wohnen mehrere Mieter auf einer Etage, legt der Vermieter zu Beginn des Kalenderjahres den Turnus fest, in welcher Woche des Kalenderjahres welcher Mieter die Treppenhausreinigung durchzuführen hat. Die Treppenhausreinigung hat samstags bis 10:00 Uhr zu erfolgen.",
      "(14.3) Die in den Absätzen 1 und 2 geregelten Verpflichtungen und Leistungen treffen den Mieter nicht, wenn, soweit und solange der Vermieter einen Dritten mit der Durchführung und Erfüllung dieser Verpflichtungen und Arbeiten betraut bzw. beauftragt hat. In diesem Fall werden die Kosten bei der Betriebskostenabrechnung berücksichtigt. Der Mieter stimmt bereits hiermit einer etwaigen Übertragung auf Dritte zu.",
      "(14.4) Auftretende Verunreinigungen der gemeinschaftlich genutzten Räume oder des Hausflures bzw. der Kellergänge sind vom Verursacher umgehend zu beseitigen."
    ]
  },
  {
    "num": 15,
    "title": "Schönheitsreparaturen während und am Ende der Mietzeit",
    "paragraphs": [
      "(15.1) Der Mieter hat die Wohnung im renovierten Zustand übernommen. Der Mieter übernimmt die Schönheitsreparaturen während der Mietzeit, soweit sie aufgrund seines Mietgebrauchs erforderlich werden.",
      "(15.2) Die Schönheitsreparaturen sind auszuführen, sobald der jeweilige Raum renovierungsbedürftig ist.",
      "(15.3) Bei Beendigung des Mietvertrages sind die nach § 15.2 fälligen Schönheitsreparaturen durchzuführen. Der Mieter ist verpflichtet, sich vor Beginn der Durchführung derartiger Arbeiten über den Umfang geplanter Veränderungen (z.B. Umbaumaßnahmen des Vermieters), die seine Renovierungsleistungen beeinträchtigen könnten, zu erkundigen."
    ]
  },
  {
    "num": 16,
    "title": "Kleinreparaturen und Wartungen",
    "paragraphs": [
      "(16.1) Die Kosten für kleine Instandhaltungen, die durch den Mietgebrauch während der Mietdauer erforderlich werden, sind vom Mieter zu tragen, soweit die Schäden nicht vom Vermieter zu vertreten sind. Die kleinen Instandhaltungen umfassen nur das Beheben kleiner Schäden an den Installationsgegenständen für Elektrizität, Wasser und Gas, den Heiz- und Kocheinrichtungen, den Fenster- und Türverschlüssen sowie den Verschlussvorrichtungen von Fensterläden und Rollladen. Eine kleine Instandhaltung (Kleinreparatur) ist gegeben, wenn der Reparaturaufwand 100,00 EURO im Einzelfall nicht übersteigt. Sofern der Mieter bereits in einem Mietjahr Kosten für kleine Instandhaltungen von insgesamt bis zu 8% der Jahresgrundmiete getragen hat, ruht diese Verpflichtung bis zum Ende des Mietjahres.",
      "(16.2) Sind in der Wohnung Warmwassergeräte (z. B. Durchlauferhitzer) und/oder eine Gasetagenheizung vorhanden, hat der Mieter diese einmal jährlich durch einen Fachmann warten zu lassen, sofern der Aufwand pro Jahr nicht 4% der Jahresgrundmiete übersteigt."
    ]
  },
  {
    "num": 17,
    "title": "Beendigung und stillschweigende Verlängerung des Mietvertrages",
    "paragraphs": [
      "(17.1) Während der Zeit eines wechselseitigen Kündigungsverzichts oder bei einem befristeten Mietvertrag kann eine Beendigung nur durch eine außerordentliche Kündigung mit gesetzlicher Frist (§ 573d BGB) oder fristlos aus wichtigem Grund (§§ 543, 569 BGB) herbeigeführt werden. Ansonsten gelten die gesetzlichen Kündigungstatbestände.",
      "(17.2) Eine stillschweigende Fortsetzung des Mietvertrages findet auch dann nicht statt, wenn der Mieter nach Ablauf der Mietzeit den Gebrauch der Mietsache fortsetzt, ohne dass eine Partei ihren entgegenstehenden Willen innerhalb von 2 Wochen dem anderen Teil gegenüber äußert. § 545 BGB findet keine Anwendung."
    ]
  },
  {
    "num": 18,
    "title": "Besichtigungsrecht des Vermieters",
    "paragraphs": [
      "(18.1) Der Vermieter oder sein Beauftragter können nach Vorankündigung das Mietobjekt in Abstimmung mit dem Mieter besichtigen, wenn dies zur ordentlichen Verwaltung des Hauses notwendig ist. Der Zeitraum für die Vorankündigung richtet sich nach der Dringlichkeit des Anlasses und beträgt in der Regel mindestens 24 Stunden. Daneben besteht das allgemeine Besichtigungs- und Prüfrecht des Vermieters, der seine Ausübung in angemessener Zeit vorher anzukündigen hat, in einem Turnus von 2 Jahren.",
      "(18.2) Will der Vermieter das Grundstück oder das Mietobjekt verkaufen, so dürfen er oder sein Beauftragter nach Vorankündigung und, soweit persönliche Gründe des Mieters nicht entgegenstehen, das Mietobjekt zusammen mit den Kaufinteressenten an Werktagen von 10:00 Uhr bis 13:00 Uhr und von 15:00 Uhr bis 18:00 Uhr besichtigen. Außerhalb dieser Zeiten sowie an Sonn- und Feiertagen kann der Vermieter nur aus besonderen Gründen terminliche Absprachen verlangen.",
      "(18.3) Ist das Mietverhältnis gekündigt oder aufgehoben, dürfen der Vermieter oder sein Beauftragter das Mietobjekt mit den Mietinteressenten, Handwerkern und Sachverständigen entsprechend der Regelung in Absatz 2 besichtigen."
    ]
  },
  {
    "num": 19,
    "title": "Rückgabe der Mietsache und Verjährung",
    "paragraphs": [
      "(19.1) Der Vermieter ist zu einer Rücknahme der Wohnung vor Ablauf der Mietzeit nicht verpflichtet, solange die Parteien hierüber keine anders lautende Vereinbarung getroffen haben.",
      "(19.2) Die Rückgabe der Mietsache findet spätestens am letzten Tag des Mietverhältnisses innerhalb der üblichen Arbeitszeiten des Vermieters von 8.00 bis 17.00 Uhr statt, sofern die Parteien nichts anderes vereinbaren. Fällt der letzte Tag auf einen Sonnabend, Sonntag oder gesetzlichen Feiertag, hat die Rückgabe vorbehaltlich anderer Vereinbarungen der Parteien am letzten Werktag davor während der üblichen Arbeitszeiten von 8.00 bis 17.00 Uhr stattzufinden.",
      "(19.3) Neben den Verpflichtungen aus § 15 ist die Mietsache in vollständig geräumtem und sauber gereinigtem Zustand vom Mieter an den Vermieter zu übergeben. Die Sanitäranlagen und die übrigen Einrichtungen der Mietsache sind von Grund auf zu reinigen.",
      "(19.4) Hat der Mieter – auch: mit Zustimmung des Vermieters – Änderungen der Mietsache vorgenommen oder sie mit Einbauten versehen, so hat er den ursprünglichen Zustand bis zur Beendigung des Mietvertrages, spätestens jedoch – sofern dieser Termin nach der Beendigung des Mietvertrages liegt – bis zu seinem Auszug wiederherzustellen. Dies gilt nicht, sofern die Parteien während des Mietvertrages hinsichtlich der einzelnen Maßnahme eine andere Vereinbarung getroffen haben. Für Anlagen und Einrichtungen (z. B. Schilder, Aufschriften) innerhalb und außerhalb der Mieträume gilt das gleiche. Der Vermieter kann verlangen, dass Änderungen der Mietsache, Anlagen oder Einrichtungen beim Auszug zurückbleiben, wenn er den Mieter angemessen entschädigt. Dem Vermieter steht dieses Recht nicht zu, wenn der Mieter an der Mitnahme ein berechtigtes Interesse hat. Die Beseitigungspflicht nach Satz 1 besteht auch dann, wenn der Mieter die Änderung von dem Vormieter übernommen hat oder ein Nachmieter zur Übernahme der Änderungen bereit ist, es sei denn, der Vermieter entlässt den Mieter aus seiner Verpflichtung. Der Mieter ist für die Erklärung des Vermieters über die Entlassung beweispflichtig. (19.5) Bei Auszug hat der Mieter alle Schlüssel, auch die von ihm selbst beschafften, an den Vermieter zu übergeben. Anderenfalls ist der Vermieter berechtigt, die Schlösser zu erneuern und neue Schlüssel anfertigen zu lassen, sofern der Mieter den Verlust der Schlüssel zu vertreten hat und sich aus dem Verlust der Schlüssel eine Gefahr für die Mietsache ergibt."
    ]
  },
  {
    "num": 20,
    "title": "Wohnungsabnahme",
    "paragraphs": [
      "(20.1) Im Falle der Beendigung des Mietvertrages ist der Mieter verpflichtet, mit dem Vermieter eine Wohnungsabnahme durchzuführen. Bei der Wohnungsabnahme wird die Mietsache besichtigt, um deren Zustand festzustellen, damit der Umfang der vom Mieter (noch) geschuldeten Leistungen, insbesondere im Hinblick auf § 15, ermittelt werden kann.",
      "(20.2) Wurde das Mietverhältnis ordentlich gekündigt, ist der Mieter verpflichtet, spätestens 4 Wochen vor Beendigung des Mietvertrages mit dem Vermieter einen Termin zur Vorbesichtigung der Wohnung innerhalb der üblichen Arbeitszeiten des Vermieters von 8.00 bis 17.00 Uhr werktags zu vereinbaren, sofern die Parteien nicht einen außerhalb dieser Tageszeiten liegenden Zeitpunkt vereinbaren. Bei dieser Vorbesichtigung wird der Umfang der bis zur Beendigung des Mietvertrages durchzuführenden Arbeiten des Mieters gemeinschaftlich festgelegt, ohne dass damit eine Beschränkung auf diese Arbeiten stattfindet, sofern dies nicht ausdrücklich vereinbart wird. Über das Ergebnis des Termins wird ein Protokoll gefertigt, das von beiden Parteien zu unterschreiben ist.",
      "(20.3) Spätestens bei Beendigung des Mietvertrages bzw. im Fall der fristlosen Kündigung bei Auszug findet eine endgültige Wohnungsabnahme statt. Hierzu hat der Mieter während der üblichen Arbeitszeiten des Vermieters von 8.00 bis 17.00 Uhr werktags einen Termin in der Wohnung zu vereinbaren, sofern die Parteien sich nicht auf einen außerhalb dieser Tageszeiten liegenden Termin einigen. § 19 Abs. 2 S. 2 gilt entsprechend. Die Wohnungsabnahme hat in geräumtem Zustand stattzufinden. Bei der Wohnungsabnahme wird ein Abnahmeprotokoll erstellt. Das Abnahmeprotokoll ist von beiden Parteien zu unterschreiben.",
      "(20.4) Kommt der Mieter der Verpflichtung zur Vereinbarung einer vorläufigen oder endgültigen Wohnungsabnahme nicht nach, bestimmt der Vermieter den Termin zur endgültigen Wohnungsabnahme während seiner Arbeitszeiten nach billigem Ermessen. Der vom Vermieter bestimmte Termin ist verbindlich, wenn er mindestens 24 Stunden vorher angekündigt wurde."
    ]
  },
  {
    "num": 21,
    "title": "Personenmehrheit der Mieter",
    "paragraphs": [
      "(21.1) Mehrere Mieter bilden im Verhältnis zum Vermieter keine Gesellschaft bürgerlichen Rechts, sofern nicht in der Parteibezeichnung eingangs dieses Vertrages diese Rechtsform ausdrücklich vermerkt ist. Das Innenverhältnis der Parteien bleibt durch diese Regelung unberührt.",
      "(21.2) Mehrere Mieter haften für alle Verpflichtungen aus dem Mietvertrag als Gesamtschuldner. Falls einer von mehreren Mietern auszieht, wird hierdurch seine Haftung für die Verpflichtung aus dem Mietvertrag nicht berührt. Eine Entlassung aus der Haftung ist nur mit ausdrücklichem Einverständnis des Vermieters und der anderen Mietpartei(-en) zulässig.",
      "(21.3) Die Mieter bevollmächtigen sich bis zum Widerruf gegenseitig zur Entgegennahme und Abgabe von Willenserklärungen gegenüber dem Vermieter. Diese Vollmacht gilt nicht für die Abgabe von Kündigungen und den Abschluss von Mietaufhebungsverträgen sowie innerhalb von Hauptleistungspflichten. Ein Widerruf der Vollmacht wird erst für Erklärungen wirksam, die nach seinem Zugang beim Vermieter ihm gegenüber abgegeben werden.",
      "(21.4) Für die Rechtswirksamkeit einer Erklärung des Vermieters genügt es, wenn sie einem der Mieter zugeht, sofern der Zugang in der Wohnung erfolgt und die Vollmacht nicht gem. § 21.3 widerrufen wurde. Dies gilt auch für den Zugang von Kündigungen. Im Falle des Auszuges eines Mieters kann der Zugang von Willenserklärungen so lange in der Wohnung stattfinden, wie der Auszug dem Vermieter unter Angabe der neuen Anschrift nicht angezeigt wurde."
    ]
  },
  {
    "num": 22,
    "title": "Mieterwechsel",
    "paragraphs": [
      "(22.1) Außer in den im Gesetz zugelassenen Fällen bedarf jeder Mieterwechsel der Zustimmung des Vermieters und sämtlicher Mieter.",
      "(22.2) Eine Ersatzmieterregelung bedarf der ausdrücklichen Vereinbarung der Parteien, sofern sie nicht ausnahmsweise zulässig ist."
    ]
  },
  {
    "num": 23,
    "title": "Veräußerung der Mietsache",
    "paragraphs": [
      "(23.1) Im Falle der Veräußerung haftet der Vermieter nicht nach § 566 Abs. 2 BGB wie ein Bürge. (23.2) Der Mieter erklärt bereits jetzt die Zustimmung zur Entlassung des Vermieters aus der Haftung nach § 566a Satz 2 BGB, sofern der Vermieter ihn bei der Veräußerung noch einmal besonders darauf hinweist, dass sein Schweigen als Zustimmung zur Haftungsentlassung gewertet wird, wenn er nicht innerhalb von zwei Wochen widerspricht, und der Vermieter danach die Kaution einschließlich Zinsen an den Erwerber weiterleitet."
    ]
  },
  {
    "num": 24,
    "title": "Nachhaltigkeit und Informationsaustausch",
    "paragraphs": [
      "(24.1) Der Klimaschutz, die nachhaltige Nutzung und der Schutz von Wasserressourcen, der Übergang zu einer Kreislaufwirtschaft, die Vermeidung und Verminderung der Umweltverschmutzung, der Schutz und die Wiederherstellung der Biodiversität und der Ökosysteme sind Kernelemente ökologisch nachhaltiger Wirtschaftstätigkeit und eines nachhaltigen Zusammenlebens. Vermieter und Mieter sind sich ihrer eigenen Verantwortung für die Erreichung dieser Umweltziele bewusst. Vermieter und Mieter wollen im Rahmen der Bewirtschaftung und Nutzung des Mietobjekts zu diesen Umweltzielen beitragen und im Rahmen des wirtschaftlich Angemessenen Ressourcen schonen und Umweltverschmutzung vermeiden. Hierzu wollen Vermieter und Mieter insbesondere die in Anlage 5 aufgeführten Maßnahmen umsetzen.",
      "(24.2) Nachhaltiges Handeln ist nur dann möglich, wenn Entscheidungen auf einer gesicherten Datengrundlage getroffen werden können. Daher benötigt der Vermieter bereits für den Betrieb und die Verwaltung des Mietobjekts sowie eigene und interne Nutzungen entsprechende Daten. Der Vermieter unterliegt darüber hinaus als Eigentümer verschiedenen Berichtspflichten zur Nachhaltigkeit bzw. möchte im eigenen Interesse unterschiedliche Berichterstattung zur Nachhaltigkeit leisten, etwa mit Blick auf die Erfassung und Bilanzierung von sowie die Berichterstattung zu Treibhausgasemissionen (z.B. nach dem Greenhouse Gas Protocol), sonstigen Nachhaltigkeitskriterien (z.B. im Sinne von § 289c HGB bzw. etwaigen Nachfolgeregelungen oder nach dem Deutschen Nachhaltigkeitskodex, dem Sustainability Accounting Standards Board oder dem Global Compact) oder die Einordnung und ggf. Förderung des Mietobjekts als KfW-Effizienzhaus. Auch im Rahmen von Bewertungen des Mietobjekts nach Nachhaltigkeits-Zertifizierungskriterien (nach sogenannten Green-Building („Grüne Gebäude“) oder ESG (Environment, Social, Governance, d.h. Umwelt, Soziales, Unternehmensführung)-Standards) oder von Energie- und Nachhaltigkeitsmanagementsystemen legt der Vermieter Informationen über das Mietobjekt offen. Der Mieter ist daher verpflichtet, dem Vermieter Informationen über den Verbrauch von Energie (z.B. mit Blick auf die Abnahme von Mieterstrom, dem Gesamtverbrauch an Strom, ggf. auch Gas und Wärme) und von Wasser (einschl. ggf. auch Warmwasser) in der Mietsache (Mietwohnung) zur Verfügung zu stellen, soweit der Vermieter keinen eigenen Zugang zu diesen Informationen hat. Diese Informationen sind auf Jahresbasis zur Verfügung zu stellen und auf Aufforderung des Vermieters auch monatlich. Der Vermieter verpflichtet sich, die Daten vor jeder weiteren Verarbeitung zu anonymisieren (insbesondere auch durch Aggregation, also Zusammenrechnung mit anderen Verbrauchsdaten) und auch die Daten nur anonymisiert weiterzugeben. Einzelheiten zum Datenumgang erläutern die separaten Datenschutzhinweise nach Art. 13 DS-GVO."
    ]
  },
  {
    "num": 25,
    "title": "Schlussbestimmungen",
    "paragraphs": [
      "(25.1) Die Abreden der Parteien sind in diesem Vertrag erschöpfend geregelt.",
      "(25.2) Änderungen und Ergänzungen dieses Vertrages sind nur gültig, wenn sie schriftlich vereinbart werden, es sei denn, die Parteien vereinbaren ausdrücklich, dass ihre Abrede ohne schriftliche Regelung gültig sein soll. Mit einer stillschweigenden Änderung des Mietvertrages ist der Vermieter grundsätzlich nicht einverstanden.",
      "(25.3) Sollten eine oder mehrere der vorstehenden Regelungen aus irgendeinem Rechtsgrund nichtig, teilnichtig oder in sonstiger Weise rechtsunwirksam sein, so wird die Rechtswirksamkeit der übrigen vertraglichen Regelungen nicht berührt.",
      "(25.4) Der Erstunterzeichnende hält sich an das mit seiner Unterschrift abgegebene Angebot 28 Tage ab Zugang des Vertrags beim Zweitunterzeichnenden gebunden. Das Angebot gilt auch dann als rechtzeitig angenommen, wenn dem Erstunterzeichnenden innerhalb der genannten Frist die Annahme als Telefaxkopie (ohne Anlagen) zugeht.",
      "(25.5) Dieser Vertrag hat folgende Anlagen: Anlage 1 Betriebskostenverordnung; Anlage 2 Einzugsermächtigung; Anlage 3 Hausgemeinschaftsordnung; Anlage 4 Allgemeine Hinweise zur Belüftung und Beheizung und Spülen der Trinkwasserleitungen; Anlage 5 Nachhaltigkeit. Ort/Datum Ort/Datum",
      "Vermieter Mieter",
      "Vermieter Mieter"
    ]
  }
];

export const BETRKV_INTRO = "Betriebskosten sind die Kosten, die dem Eigentümer oder Erbbauberechtigten durch das Eigentum oder Erbbaurecht am Grundstück oder durch den bestimmungsmäßigen Gebrauch des Gebäudes, der Nebengebäude, Anlagen, Einrichtungen und des Grundstücks laufend entstehen.";

export const BETRKV_ITEMS: string[] = [
  "1. Die laufenden öffentlichen Lasten des Grundstücks, hierzu gehört namentlich die Grundsteuer;",
  "2. Die Kosten der Wasserversorgung, hierzu gehören die Kosten des Wasserverbrauchs, die Grundgebühren, die Kosten der Anmietung oder anderer Arten der Gebrauchsüberlassung von Wasserzählern sowie die Kosten ihrer Verwendung einschließlich der Kosten der Eichung sowie der Kosten der Berechnung und Aufteilung, die Kosten der Wartung von Wassermengenreglern, die Kosten des Betriebs einer hauseigenen Wasserversorgungsanlage und einer Wasseraufbereitungsanlage einschließlich der Aufbereitungsstoffe;",
  "3. Die Kosten der Entwässerung, hierzu gehören die Gebühren für die Haus- und Grundstücksentwässerung, die Kosten des Betriebs einer entsprechenden nicht öffentlichen Anlage und die Kosten des Betriebs einer Entwässerungspumpe;",
  "4. Die Kosten a. des Betriebs der zentralen Heizungsanlage einschließlich der Abgasanlage: hierzu gehören die Kosten der verbrauchten Brennstoffe und ihrer Lieferung, die Kosten des Betriebsstroms, die Kosten der Bedienung, Überwachung und Pflege der Anlage, der regelmäßigen Prüfung ihrer Betriebsbereitschaft und Betriebssicherheit einschließlich der Einstellung durch eine Fachkraft, der Reinigung der Anlage und des Betriebsraums, die Kosten der Messungen nach dem Bundes-Immissionsschutzgesetz, die Kosten der Anmietung oder anderer Arten der Gebrauchsüberlassung einer Ausstattung zur Verbrauchserfassung sowie die Kosten der Verwendung einer Ausstattung zur Verbrauchserfassung einschließlich der Kosten der Eichung sowie der Kosten der Berechnung und Aufteilung; oder b. des Betriebs der zentralen Brennstoffversorgungsanlage: hierzu gehören die Kosten der verbrauchten Brennstoffe und ihrer Lieferung, die Kosten des Betriebsstroms und die Kosten der Überwachung sowie die Kosten der Reinigung der Anlage und des Betriebsraums; oder c. der eigenständig gewerblichen Lieferung von Wärme, auch aus Anlagen im Sinne des Buchstabens a: hierzu gehören das Entgelt für die Wärmelieferung und die Kosten des Betriebs der zugehörigen Hausanlagen entsprechend Buchstabe a; oder d. der Reinigung und Wartung von Etagenheizungen und Gaseinzelfeuerstätten: hierzu gehören die Kosten der Beseitigung von Wasserablagerungen und Verbrennungsrückständen in der Anlage, die Kosten der regelmäßigen Prüfung der Betriebsbereitschaft und Betriebssicherheit und der damit zusammenhängenden Einstellung durch eine Fachkraft sowie die Kosten der Messungen nach dem Bundes-Immissionsschutzgesetz;",
  "5. Die Kosten a. des Betriebs der zentralen Warmwasserversorgungsanlage: hierzu gehören die Kosten der Wasserversorgung entsprechend Nummer 2, soweit sie nicht dort bereits berücksichtigt sind, und die Kosten der Wassererwärmung entsprechend Nummer 4 Buchstabe a; oder b. der eigenständig gewerblichen Lieferung von Warmwasser, auch aus Anlagen im Sinne des Buchstabens a: hierzu gehören das Entgelt für die Lieferung des Warmwassers und die Kosten des Betriebs der zugehörigen Hausanlage entsprechend Nummer 4 Buchstabe a; oder c. der Reinigung und Wartung von Warmwassergeräten: hierzu gehören die Kosten der Beseitigung von Wasserablagerungen und Verbrennungsrückständen im Innern der Geräte sowie die Kosten der regelmäßigen Prüfung der Betriebsbereitschaft und Betriebssicherheit und der damit zusammenhängenden Einstellung durch eine Fachkraft;",
  "6. Die Kosten verbundener Heizungs- und Warmwasserversorgungsanlagen a. bei zentralen Heizungsanlagen entsprechend Nummer 4 Buchstabe a und entsprechend Nummer 2, soweit sie nicht dort bereits berücksichtigt sind, oder b. bei der eigenständig gewerblichen Lieferung von Wärme entsprechend Nummer 4 Buchstabe c und entsprechend Nummer 2, soweit sie nicht dort bereits berücksichtigt sind, oder c. bei verbundenen Etagenheizungen und Warmwasserversorgungsanlagen entsprechend Nummer 4 Buchstabe d und entsprechend Nummer 2, soweit sie nicht dort bereits berücksichtigt sind;",
  "7. Die Kosten des Betriebs des maschinellen Personen- oder Lastenaufzugs, hierzu gehören die Kosten des Betriebsstroms, die Kosten der Beaufsichtigung, der Bedienung, Überwachung und Pflege der Anlage, der regelmäßigen Prüfung ihrer Betriebsbereitschaft und Betriebssicherheit einschließlich der Einstellung durch eine Fachkraft sowie die Kosten der Reinigung der Anlage;",
  "8. Die Kosten der Straßenreinigung und Müllbeseitigung: zu den Kosten der Straßenreinigung gehören die für die öffentliche Straßenreinigung zu entrichtenden Gebühren und die Kosten entsprechender nicht öffentlicher Maßnahmen; zu den Kosten der Müllbeseitigung gehören namentlich die für die Müllabfuhr zu entrichtenden Gebühren, die Kosten entsprechender nicht öffentlicher Maßnahmen, die Kosten des Betriebs von Müllkompressoren, Müllschluckern, Müllabsauganlagen sowie des Betriebs von Müllmengenerfassungsanlagen einschließlich der Kosten der Berechnung und Aufteilung;",
  "9. Die Kosten der Gebäudereinigung und Ungezieferbekämpfung: zu den Kosten der Gebäudereinigung gehören die Kosten für die Säuberung der von den Bewohnern gemeinsam genutzten Gebäudeteile, wie Zugänge, Flure, Treppen, Keller, Bodenräume, Waschküchen, Fahrkorb des Aufzugs;",
  "10. Die Kosten der Gartenpflege, hierzu gehören die Kosten der Pflege gärtnerisch angelegter Flächen einschließlich der Erneuerung von Pflanzen und Gehölzen, der Pflege von Spielplätzen einschließlich der Erneuerung von Sand und der Pflege von Plätzen, Zugängen und Zufahrten, die dem nicht öffentlichen Verkehr dienen;",
  "11. Die Kosten der Beleuchtung, hierzu gehören die Kosten des Stroms für die Außenbeleuchtung und die Beleuchtung der von den Bewohnern gemeinsam genutzten Gebäudeteile, wie Zugänge, Flure, Treppen, Keller, Bodenräume, Waschküchen;",
  "12. Die Kosten der Schornsteinreinigung, hierzu gehören die Kehrgebühren nach der maßgebenden Gebührenordnung, soweit sie nicht bereits als Kosten nach Nummer 4 Buchstabe a berücksichtigt sind;",
  "13. Die Kosten der Sach- und Haftpflichtversicherung, hierzu gehören namentlich die Kosten der Versicherung des Gebäudes gegen Feuer-, Sturm-, Wasser- sowie sonstige Elementarschäden, der Glasversicherung, der Haftpflichtversicherung für das Gebäude, den Öltank und den Aufzug;",
  "14. Die Kosten für den Hauswart, hierzu gehören die Vergütung, die Sozialbeiträge und alle geldwerten Leistungen, die der Eigentümer oder Erbbauberechtigte dem Hauswart für seine Arbeit gewährt, soweit diese nicht die Instandhaltung, Instandsetzung, Erneuerung, Schönheitsreparaturen oder die Hausverwaltung betrifft; soweit Arbeiten vom Hauswart ausgeführt werden, dürfen Kosten für Arbeitsleistungen nach den Nummern 2 bis 10 und 16 nicht angesetzt werden;",
  "15. Die Kosten a. des Betriebs der Gemeinschafts-Antennenanlage: hierzu gehören die Kosten des Betriebsstroms und die Kosten der regelmäßigen Prüfung ihrer Betriebsbereitschaft einschließlich der Einstellung durch eine Fachkraft oder das Nutzungsentgelt für eine nicht zu dem Gebäude gehörende Antennenanlage sowie die Gebühren, die nach dem Urheberrechtsgesetz für die Kabelweitersendung entstehen; oder b. des Betriebs der mit einem Breitbandkabelnetz verbundenen privaten Verteilanlage: hierzu gehören die Kosten entsprechend Buchstabe a, ferner die laufenden monatlichen Grundgebühren für Breitbandanschlüsse;",
  "16. Die Kosten des Betriebs der Einrichtungen für die Wäschepflege, hierzu gehören die Kosten des Betriebsstroms, die Kosten der Überwachung, Pflege und Reinigung der Einrichtungen, der regelmäßigen Prüfung ihrer Betriebsbereitschaft und Betriebssicherheit sowie die Kosten der Wasserversorgung entsprechend Nummer 2, soweit sie nicht dort bereits berücksichtigt sind;",
  "17. Sonstige Betriebskosten, hierzu gehören Betriebskosten im Sinne des § 1 BetrKV, die von den Nummern 1 bis 16 nicht erfasst sind."
];
