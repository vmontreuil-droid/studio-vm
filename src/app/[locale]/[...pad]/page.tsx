import { notFound } from "next/navigation";

// Elk onbekend adres onder een geldige taal (/fr/xyz) toont de vertaalde
// 404 binnen de site-layout, met echte status 404.
export default function Onbekend() {
  notFound();
}
