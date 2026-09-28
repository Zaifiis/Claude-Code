import type { MetadataRoute } from "next";

/**
 * Lets Studio be installed to a home screen and run without browser chrome,
 * which is most of the difference between a site you visit and an app you open.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Content Studio",
    short_name: "Studio",
    description: "Content ideas, scripts and the order they get made in.",
    start_url: "/studio",
    scope: "/studio",
    display: "standalone",
    orientation: "portrait",
    background_color: "#101013",
    theme_color: "#101013",
    icons: [
      { src: "/studio/icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
