import type { Metadata } from "next";

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function createPublicMetadata({ title, description, path }: PublicMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: `${title} | Kireeye`,
      description,
      siteName: "Kireeye",
      locale: "so_SO",
    },
    twitter: {
      card: "summary",
      title: `${title} | Kireeye`,
      description,
    },
  };
}

export const privateMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export const utilityMetadata: Metadata = {
  robots: { index: false, follow: true, nocache: true },
};
