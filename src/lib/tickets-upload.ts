// Opladen van ticketbijlagen vanuit de browser: rechtstreeks naar de
// eenmalige upload-links (UploadPlek) die de server aanmaakte — geen sleutel
// in de browser, en grote plannen gaan niet door een server action.
// Client-veilig: geen server-imports.

import { mimeVoor, type GeuploadBestand, type UploadPlek } from "@/lib/tickets";

function put(url: string, f: File, opGeladen: (geladen: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", f.type || mimeVoor(f.name));
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => opGeladen(e.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`HTTP ${xhr.status}: ${String(xhr.responseText ?? "").slice(0, 200)}`));
    xhr.onerror = () => reject(new Error("netwerkfout"));
    xhr.onabort = () => reject(new Error("afgebroken"));
    xhr.send(f);
  });
}

/**
 * Laadt `files` één voor één op naar `plekken` (zelfde volgorde als de lijst
 * die naar de server ging). `opVoortgang(fractie 0..1, geladen bytes, totaal
 * bytes)` — de fractie kan rechtstreeks naar BestandenKiezer.voortgang.
 * Gooit een Error bij een antwoord buiten 2xx of een netwerkfout.
 */
export async function uploadBestanden(
  plekken: UploadPlek[],
  files: File[],
  opVoortgang?: (fractie: number, geladen: number, totaal: number) => void,
): Promise<GeuploadBestand[]> {
  if (plekken.length !== files.length) throw new Error("upload-links en bestanden komen niet overeen");
  const totaal = files.reduce((t, f) => t + f.size, 0);
  const meld = (geladen: number) => opVoortgang?.(totaal > 0 ? Math.min(1, geladen / totaal) : 1, geladen, totaal);
  const uit: GeuploadBestand[] = [];
  let klaar = 0;
  meld(0);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const p = plekken[i];
    await put(p.url, f, (x) => meld(klaar + Math.min(x, f.size)));
    klaar += f.size;
    meld(klaar);
    uit.push({ naam: p.naam, pad: p.pad, grootte: f.size });
  }
  return uit;
}
