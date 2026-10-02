import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studio VM — 3D-modellen voor machinesturing",
    short_name: "Studio VM",
    description:
      "3D-ontwerpmodellen voor GPS-machinesturing (Trimble, Topcon, Leica, Unicontrol, CHCNAV, Komatsu, Caterpillar) in het juiste coördinatenstelsel, voor aannemers in heel Europa.",
    lang: "nl",
    start_url: "/nl",
    scope: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#b45309",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
