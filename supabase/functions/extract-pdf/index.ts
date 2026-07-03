// Supabase Edge Function — PDF -> deal data extraction via Claude.
//
// NOT YET WIRED UP. The frontend (src/DealManagerApp.tsx) currently stubs
// extractFromPDF()/extractFromMultiplePDFs() and never calls this function —
// that was a deliberate choice when this project was migrated off the
// Claude Artifacts sandbox (which injected Anthropic auth for free; a real
// deployment has no such thing, so the original direct-from-browser fetch()
// calls to api.anthropic.com were removed).
//
// To enable this feature:
//   1. supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   2. supabase functions deploy extract-pdf
//   3. In src/DealManagerApp.tsx, replace the stub extractFromPDF /
//      extractFromMultiplePDFs bodies with a call to this function, e.g.:
//        const { data: { session } } = await supabase.auth.getSession();
//        const res = await fetch(`${SUPABASE_URL}/functions/v1/extract-pdf`, {
//          method: 'POST',
//          headers: {
//            'Content-Type': 'application/json',
//            Authorization: `Bearer ${session.access_token}`,
//          },
//          body: JSON.stringify({ mode: 'single', file: { name, data: base64 } }),
//        });
//        const data = await res.json();
//   4. Also call uploadPropertyDocuments() as already wired, so the source
//      PDF is archived regardless of extraction success.
//
// The prompts and JSON-repair logic below are ported verbatim from the
// original artifact (src/DealManagerApp.tsx history) — nothing about the
// underlying extraction logic changed, only where it runs.

// deno-lint-ignore-file no-explicit-any

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODEL = 'claude-sonnet-4-6';

// =============================================================
// EXTRACTION PROMPT
// =============================================================
const EXTRACTION_PROMPT = `Du bist ein Experte für die Analyse von Schweizer Immobilien-Exposés (Investment-Memoranda).

Extrahiere aus dem beigefügten PDF folgende Daten und gib sie als JSON zurück.
Wenn ein Wert nicht eindeutig im Dokument enthalten ist, setze null.
Bei Zahlen: nur die Zahl, ohne Einheiten oder Tausendertrennzeichen.

Antworte AUSSCHLIESSLICH mit dem JSON-Objekt — keine Markdown-Codeblöcke, keine Erklärungen.

{
  "objectName": "string oder null — Name/Bezeichnung der Liegenschaft",
  "address": "string oder null — vollständige Adresse",
  "canton": "string oder null — Kantonskürzel (ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, FR, SO, BS, BL, SH, AR, AI, SG, GR, AG, TG, TI, VD, VS, NE, GE, JU)",
  "objectType": "string oder null — z.B. Mehrfamilienhaus, Geschäftshaus, Mixed-Use",
  "ownershipType": "string oder null — Eigentumsform: 'Alleineigentum', 'STWE-Aufteilung', 'Miteigentum', 'Baurecht' o.ä.",
  "purchasePrice": "number oder null — Kaufpreis in CHF",
  "rentalArea": "number oder null — gesamte Mietfläche in m² (Wohnen + Gewerbe zusammen)",
  "residentialArea": "number oder null — NUR Wohnfläche in m² (falls separat ausgewiesen)",
  "commercialArea": "number oder null — NUR Gewerbefläche in m² (Büros, Laden, Atelier, Restaurant etc.)",
  "landArea": "number oder null — Grundstücksfläche in m²",
  "netTargetRent": "number oder null — Netto-Mietertrag bei Vollvermietung p.a. in CHF",
  "netActualRent": "number oder null — Netto-Ist-Mietertrag p.a. in CHF (aktueller Stand)",
  "marketRent": "number oder null — Marktmiete / Mietpotenzial p.a. in CHF, was bei Neuvermietung zu aktuellen Marktpreisen erzielbar wäre (oft im Exposé als 'Mietpotenzial', 'Marktmiete', 'Indexbereinigte Vergleichsmiete' bezeichnet)",
  "vacancyRate": "number oder null — durchschnittliche Leerstandsquote in % (z.B. 3.5)",
  "constructionYear": "number oder null — Baujahr",
  "heating": "string oder null — Heizungsart (z.B. Erdgas, Wärmepumpe, Fernwärme)",
  "parkingSpaces": "number oder null — Anzahl Parkplätze",
  "numberOfUnits": "number oder null — Anzahl Mieteinheiten",
  "opportunities": "string oder null — Chancen, Mehrwert und Optimierungspotenzial dieses Objekts in 2-4 Sätzen. Beispiele: 'Mietzinspotenzial durch Aufwertung der Wohnungen ca. 15% über Marktmiete erzielbar', 'STWE-Aufteilung möglich, Verkauf einzelner Einheiten würde Verkaufspreis um ca. 20% steigern', 'Dachausbau mit zusätzlicher Wohneinheit möglich gemäss Zonenplan'. Ehrliche Einschätzung, kein Marketing-Sprech.",
  "tenantSchedule": [
    {
      "label": "string — Bezeichnung der Einheit, z.B. 'Wohnung EG rechts', '3.5 Zi 2.OG', 'Ladenfläche EG', 'Atelier UG'",
      "type": "apartment|commercial — apartment für Wohnungen, commercial für Gewerbe/Büro/Laden",
      "rooms": "number oder null — Zimmerzahl bei Wohnungen (z.B. 3.5, 4.5)",
      "m2": "number oder null — Fläche in m²",
      "rentMonthly": "number oder null — aktuelle Nettomiete pro Monat in CHF",
      "rentYearly": "number oder null — aktuelle Nettomiete pro Jahr in CHF (falls statt monatlich angegeben)",
      "tenant": "string oder null — Mietername falls genannt",
      "status": "vermietet|leerstehend|null — Vermietungsstatus"
    }
  ],
  "deadlines": [
    { "date": "YYYY-MM-DD", "description": "string — z.B. Bid Deadline, Indikatives Angebot, Closing" }
  ],
  "riskAnalysis": [
    {
      "severity": "high|medium|low — high für kritische Risiken (Sanierungsbedarf, Altlasten, Zonenkonflikt), medium für relevante Themen (alte Heizung ohne Wärmepumpe, kurze Restlaufzeit Mietverträge, Klumpenrisiko Mieter), low für Hinweise (kosmetische Renovation nötig, kleine Gebäude-Themen)",
      "title": "string — kurze Bezeichnung max 5 Wörter, z.B. 'Heizung Erdgas, ineffizient' oder 'Baurecht endet 2034'",
      "description": "string — eine Erläuterung in 1 Satz, faktisch, ohne Spekulation"
    }
  ],
  "saleUnits": [
    {
      "type": "apartment|parking_garage|parking_outdoor",
      "label": "string — kurze Bezeichnung wie 'Attika 4.5 Zi', 'EG 3.5 Zi', 'TG-Parkplatz', 'Aussen-PP'",
      "m2": "number oder null — bei apartment: Wohnfläche in m², sonst null",
      "pricePerM2": "number oder null — bei apartment: vorgeschlagener Verkaufspreis pro m² in CHF (falls Exposé das angibt oder herleitbar)",
      "fixedPrice": "number oder null — Festpreis in CHF (Pflicht bei Parkplätzen, optional bei apartment falls kein m²-Preis vorhanden)",
      "count": "number — Anzahl identischer Einheiten (z.B. 3 wenn drei baugleiche Wohnungen vorhanden, 12 bei 12 TG-Parkplätzen)"
    }
  ],
  "contacts": [
    {
      "name": "string — Vor- und Nachname der Kontaktperson",
      "company": "string oder null — Firma/Organisation (z.B. 'Alfred Müller', 'H&B Real Estate AG', 'Privatperson')",
      "role": "string oder null — Funktion/Rolle (z.B. 'Verkaufsberater', 'Asset Manager', 'Eigentümer', 'Architekt', 'Treuhänder', 'Makler')",
      "email": "string oder null — E-Mail-Adresse",
      "phone": "string oder null — Telefonnummer im Format +41XXXXXXXXX oder lokal"
    }
  ]
}

Bei der riskAnalysis: Identifiziere 3–8 konkrete Risiken oder Auffälligkeiten aus dem Exposé. Beispiele für typische Risiken: Heizungsart und Alter (alte Ölheizung, fossile Brennstoffe vor CO2-Verschärfungen), Baurecht/Erbbaurecht und Restlaufzeit, Sanierungsstau, hohe Leerstandsquote, Klumpenrisiko bei wenigen Hauptmietern, Lärmemissionen/Lage, Zonenplan-Restriktionen, Altlasten, geplante Bauprojekte in Umgebung, Sanierungspflicht durch energetische Vorschriften. Wenn das Exposé wenig Info hergibt, fokussiere auf 3–4 wichtige Punkte. Ehrliche Einschätzung — auch wenn das Exposé etwas verschweigt, kann das ein Risiko sein.

WICHTIG bei tenantSchedule (Wohnungsspiegel / Mieterspiegel): Schaue GENAU in das Dokument nach einer Tabelle/Aufstellung der einzelnen Mieteinheiten. Diese erscheint in den meisten Exposés unter Bezeichnungen wie "Mieterspiegel", "Wohnungsspiegel", "Mietzinsliste", "Mietzinsaufstellung", "Mieteraufstellung", "Rent Roll", "Übersicht Mietverhältnisse", "Mieterzusammenstellung" oder einfach als Tabelle mit Spalten wie "Wohnung", "Fläche", "Miete". Extrahiere JEDE einzelne Zeile dieser Tabelle als separaten Eintrag. Für jede Einheit: label (Bezeichnung wie 'Wohnung EG rechts', '3.5-Zi 2.OG', 'Laden EG'), type ('apartment' für Wohnungen, 'commercial' für Gewerbe/Büros/Läden/Ateliers/Restaurants), rooms (Zimmerzahl bei Wohnungen, z.B. 3.5), m2 (Mietfläche), rentMonthly ODER rentYearly (je nachdem wie die Miete im Dokument angegeben ist — Achtung: oft ist Netto-Monatsmiete vs Brutto-Monatsmiete unterschieden, nimm die NETTO-Miete), tenant (Mietername falls genannt, sonst null), status ('vermietet' wenn ein Mieter genannt ist oder explizit als vermietet markiert, 'leerstehend' wenn explizit als leer markiert). Falls KEIN Mieterspiegel im Dokument ist, gib leeres Array [] zurück. Parkplätze gehören NICHT in tenantSchedule (die kommen in saleUnits).

Bei saleUnits: Extrahiere die einzelnen Stockwerkeigentums-Einheiten WENN das Exposé eine Aufstellung pro Wohnung/Parkplatz enthält (Mieter-/Verkaufsspiegel, Wohnungsliste, STWE-Übersicht, Quotentabelle). Identische Einheiten kannst du zusammenfassen (count > 1). Wenn das Exposé keine Aufschlüsselung enthält, gib ein leeres Array [] zurück. Falls Verkaufspreise pro Einheit fehlen aber Mietflächen vorhanden sind, fülle nur m2 und label aus — pricePerM2 und fixedPrice bleiben null. Bei Parkplätzen: type='parking_garage' für TG/Tiefgarage/Einstellhalle, 'parking_outdoor' für Aussen/Besucher/Oberflächen-Parkplätze.

Bei contacts: Identifiziere ALLE im Exposé genannten Kontaktpersonen (Verkaufsberater, Asset Manager, Architekten, Treuhänder, Makler, Eigentümer-Vertreter). Suche nach E-Mail-Adressen, Telefonnummern, Namen mit Funktionsbezeichnung. Falls eine Firma genannt wird aber keine konkrete Person, verwende name='Allgemein' und company=Firmenname. Telefonnummern in Schweizer Format (+41...). Bei mehreren Kontakten aus derselben Firma: einzelne Einträge anlegen.`;

const COMBINED_EXTRACTION_PROMPT = `Du analysierst MEHRERE Dokumente die ALLE zur GLEICHEN Schweizer Immobilien-Transaktion gehören. Typischerweise: ein Hauptexposé (Investment-Memorandum, Verkaufsprospekt) PLUS Grundrisse einzelner Wohnungen/Stockwerke.

DEIN VORGEHEN:
1. Identifiziere zuerst welche Datei das Hauptexposé ist (umfassendes Dokument mit Kaufpreis, Mieten, Lageinfos) und welche Grundrisse sind (Pläne mit Raumaufteilung, Beschriftungen wie "3.5 Zi-Whg", m²-Angaben pro Raum).
2. Extrahiere die Hauptdaten primär aus dem Exposé.
3. Aus den GRUNDRISSEN extrahiere für JEDE Wohnung: Bezeichnung (z.B. "Wohnung 3.OG rechts", "Attika"), Zimmerzahl falls erkennbar, GESAMT-Wohnfläche in m² (Summe aller Räume oder explizit angegebener Total-Wert).
4. Grundrisse zeigen oft m²-Angaben pro Raum — addiere diese zur Gesamt-Wohnfläche, ODER nutze den explizit auf dem Plan angegebenen Total-Wert ("Wohnfläche total: 124.5 m²").
5. Wenn auf dem Grundriss eine Wohnungsbezeichnung steht (z.B. "Wohnung 4.5 Zi, 3. OG"), nutze diese als label.
6. Falls eine Wohnung im Exposé UND im Grundriss vorkommt: bevorzuge die Grundriss-m²-Zahl (genauer) aber das Exposé-Label/Stockwerk falls präziser.

Gib die Daten als JSON zurück — IDENTISCHES Schema wie beim Single-PDF-Extract:

{
  "objectName": "string oder null",
  "address": "string oder null",
  "canton": "string oder null",
  "objectType": "string oder null",
  "ownershipType": "string oder null — z.B. Alleineigentum, STWE-Aufteilung, Miteigentum, Baurecht",
  "purchasePrice": "number oder null",
  "rentalArea": "number oder null — Total-Mietfläche (Wohnen + Gewerbe)",
  "residentialArea": "number oder null — nur Wohnfläche m²",
  "commercialArea": "number oder null — nur Gewerbefläche m²",
  "landArea": "number oder null",
  "netTargetRent": "number oder null — Vollvermietung",
  "netActualRent": "number oder null — Ist-Stand",
  "marketRent": "number oder null — Marktmiete / Mietpotenzial p.a.",
  "vacancyRate": "number oder null",
  "constructionYear": "number oder null",
  "heating": "string oder null",
  "parkingSpaces": "number oder null",
  "numberOfUnits": "number oder null — Anzahl Wohnungen, ggf. = Anzahl Grundrisse",
  "opportunities": "string oder null — Chancen & Mehrwert in 2-4 Sätzen (Mietzinspotenzial, STWE-Aufteilung, Dachausbau, Lage etc.)",
  "tenantSchedule": [
    {
      "label": "string — z.B. 'Wohnung EG rechts', '4.5 Zi Attika', 'Laden EG'",
      "type": "apartment|commercial",
      "rooms": "number oder null",
      "m2": "number oder null",
      "rentMonthly": "number oder null — CHF/Monat",
      "rentYearly": "number oder null — CHF/Jahr",
      "tenant": "string oder null",
      "status": "vermietet|leerstehend|null"
    }
  ],
  "deadlines": [{"date": "YYYY-MM-DD", "description": "string"}],
  "riskAnalysis": [{"severity": "high|medium|low", "title": "string", "description": "string"}],
  "saleUnits": [
    {
      "type": "apartment|parking_garage|parking_outdoor",
      "label": "string — kurze Bezeichnung der Wohnung",
      "m2": "number oder null — Wohnfläche aus dem Grundriss",
      "pricePerM2": "number oder null",
      "fixedPrice": "number oder null",
      "count": "number — typisch 1 wenn jede Wohnung individuell"
    }
  ],
  "sourceFiles": [
    {
      "fileName": "string — exakter Dateiname",
      "type": "exposé|grundriss|other",
      "extractedUnitLabel": "string oder null — wenn type=grundriss, welche Wohnung wurde aus dieser Datei extrahiert (label muss dem entsprechenden Eintrag in saleUnits entsprechen)"
    }
  ]
}

WICHTIG:
- Bei mehreren Grundrissen → mehrere Einträge in saleUnits, jeder mit individueller m²-Zahl aus dem jeweiligen Plan. Setze count: 1 pro Wohnung (sie sind nicht identisch).
- saleUnits-Labels sollen mit den Grundrissen verlinkbar sein → in sourceFiles.extractedUnitLabel den gleichen String verwenden.
- tenantSchedule: Wenn das Exposé einen Mieterspiegel/Wohnungsspiegel/Mietzinsliste enthält, extrahiere JEDE Zeile als separaten Eintrag mit label, type (apartment/commercial), rooms, m2, rentMonthly oder rentYearly, tenant und status. Parkplätze gehören in saleUnits, NICHT in tenantSchedule.
- Antworte AUSSCHLIESSLICH mit dem JSON-Objekt.`;

function typeContextFor(propertyType: string | undefined): string {
  if (propertyType === 'apartment') {
    return `WICHTIG: Diese Dokumente betreffen eine EINZELNE WOHNUNG (Eigentumswohnung, Stockwerkeigentum), kein Mehrfamilienhaus. Der Anlagefokus ist typischerweise Flipping oder Eigennutzung.
- Setze objectType = "Eigentumswohnung"
- "rentalArea" = Wohnfläche der Wohnung (inkl. Nebenflächen wenn ausgewiesen)
- "numberOfUnits" = 1 (es ist EINE Wohnung)
- "saleUnits" KANN leer bleiben, da kein Verkauf in Einheiten geplant ist — ausser die Wohnung soll z.B. in Untereinheiten geteilt werden
- Mieteinnahmen optional: viele Wohnungen sind selbstgenutzt oder werden geflippt
- Bei "purchasePrice" den Kaufpreis der ganzen Wohnung erfassen
- Fokus auf Sanierungspotenzial, Lage-Qualität, Wohnungstyp (z.B. "3.5 Zi Attika 95 m²")

`;
  }
  if (propertyType === 'multifamily') {
    return `WICHTIG: Diese Dokumente betreffen ein MEHRFAMILIENHAUS / Renditeliegenschaft mit mehreren Mieteinheiten.
- Setze objectType = "Mehrfamilienhaus" oder spezifischer (z.B. "MFH mit Gewerbe", "Mixed-Use")
- "numberOfUnits" = Anzahl der Mieteinheiten
- "rentalArea" = Total der Mietflächen aller Einheiten
- Mieteinnahmen (Soll und Ist) sind zentral für die Bewertung
- "saleUnits" nur wenn explizit eine STWE-Aufteilung dokumentiert ist (sonst leer)

`;
  }
  return '';
}

// =============================================================
// JSON parsing / repair (ported as-is)
// =============================================================
function tryRepairJSON(text: string): string {
  let s = text.trim();
  let inString = false;
  let escape = false;
  let openBraces = 0;
  let openBrackets = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') openBraces++;
    else if (c === '}') openBraces--;
    else if (c === '[') openBrackets++;
    else if (c === ']') openBrackets--;
  }
  if (inString) s += '"';
  s = s.replace(/,\s*$/, '');
  while (openBrackets > 0) { s += ']'; openBrackets--; }
  while (openBraces > 0) { s += '}'; openBraces--; }
  return s;
}

function parseExtractionResponse(apiData: any): any {
  const text = (apiData.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  if (!text) {
    throw new Error('Leere Antwort von Claude erhalten. Bitte erneut versuchen.');
  }

  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const firstBrace = clean.indexOf('{');
  if (firstBrace > 0) clean = clean.slice(firstBrace);

  const wasTruncated = apiData.stop_reason === 'max_tokens';

  try {
    return JSON.parse(clean);
  } catch {
    try {
      const repaired = tryRepairJSON(clean);
      const result = JSON.parse(repaired);
      if (wasTruncated) result._truncated = true;
      return result;
    } catch {
      const hint = wasTruncated
        ? ' Die Antwort war zu lang und wurde abgeschnitten — versuche es mit weniger Dateien gleichzeitig.'
        : ' Antwortformat unerwartet — bitte erneut versuchen.';
      throw new Error('JSON-Parse-Fehler.' + hint);
    }
  }
}

// =============================================================
// Handler
// =============================================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY secret is not set on this Edge Function.' }),
        { status: 501, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const content: any[] = [];

    if (body.mode === 'combined') {
      const files = body.files as { name: string; data: string }[];
      const propertyType = body.propertyType as string | undefined;
      files.forEach((f, i) => {
        content.push({ type: 'text', text: `=== Datei ${i + 1} von ${files.length}: "${f.name}" ===` });
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } });
      });
      content.push({ type: 'text', text: typeContextFor(propertyType) + COMBINED_EXTRACTION_PROMPT });
    } else {
      const file = body.file as { name: string; data: string };
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } });
      content.push({ type: 'text', text: EXTRACTION_PROMPT });
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text().catch(() => '');
      return new Response(
        JSON.stringify({ error: `Anthropic API-Fehler ${anthropicRes.status}: ${errBody.slice(0, 300)}` }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const apiData = await anthropicRes.json();
    const extracted = parseExtractionResponse(apiData);

    return new Response(JSON.stringify(extracted), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unbekannter Fehler' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
