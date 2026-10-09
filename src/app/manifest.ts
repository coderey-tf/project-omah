import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Omahku — Kelola Rumah Tangga",
    short_name: "Omahku",
    description: "Sistem Manajemen Keuangan & Rumah Tangga Privat",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f0eb",
    theme_color: "#1E3932",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
