// Gestructureerde gegevens (JSON-LD). Elke pagina bouwt haar eigen @graph met
// de helpers uit lib/schema.ts en geeft die hier door. "<" wordt ontsnapt,
// zodat tekst in de gegevens het script-element nooit kan afsluiten.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
