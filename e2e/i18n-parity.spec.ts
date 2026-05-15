import { test, expect } from "@playwright/test";
import nl from "../src/lib/i18n/messages/nl";
import fr from "../src/lib/i18n/messages/fr";
import en from "../src/lib/i18n/messages/en";

// Verzamelt alle genest sleutelpaden ("a.b.c") van een object.
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

test.describe("i18n parity", () => {
  const nlKeys = keyPaths(nl).sort();
  const frKeys = keyPaths(fr).sort();
  const enKeys = keyPaths(en).sort();

  test("FR heeft exact dezelfde sleutels als NL", () => {
    expect(frKeys).toEqual(nlKeys);
  });

  test("EN heeft exact dezelfde sleutels als NL", () => {
    expect(enKeys).toEqual(nlKeys);
  });

  test("geen lege vertaalwaarden", () => {
    for (const [name, m] of [
      ["nl", nl],
      ["fr", fr],
      ["en", en],
    ] as const) {
      const empty = keyPaths(m).filter((p) => {
        const val = p
          .split(".")
          .reduce<unknown>(
            (o, k) => (o as Record<string, unknown>)?.[k],
            m,
          );
        return typeof val === "string" && val.trim() === "";
      });
      expect(empty, `lege strings in ${name}: ${empty.join(", ")}`).toEqual([]);
    }
  });
});
