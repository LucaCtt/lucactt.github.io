export interface Work {
  title: string;
  journal: string | null;
  year: string | null;
  type: string;
  doi: string | null;
  url: string;
}

const cleanTitle = (str: string) => {
  const cleaned = str
    .trim()
    .replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
    );

  if (cleaned.toLowerCase() === "arxiv") {
    return "arXiv";
  }

  return cleaned;
};

async function getFullJournalTitle(doi: string): Promise<string | null> {
  const res = await fetch(`https://api.crossref.org/works/${doi}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.message?.["container-title"]?.[0] ?? null;
}

export const safeCompare = (a: string, b: string): boolean => {
  const normalize = (str: string): string =>
    str
      // Decompose Unicode characters (e.g., "é" -> "e" + accent mark)
      .normalize("NFD")
      // Remove diacritical marks/accents
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      // Replace all Unicode dash variations with a standard space
      .replace(/[\p{Pd}]+/gu, " ")
      // Remove remaining non-alphanumeric characters (keep numbers and letters)
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      // Collapse whitespace and trim
      .replace(/\s+/g, " ")
      .trim();

  return normalize(a) === normalize(b);
};

export async function fetchPublications(orcidId: string): Promise<Work[]> {
  const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  if (!data.group || !Array.isArray(data.group)) {
    return [];
  }

  const works: Work[] = await Promise.all(
    data.group.slice(0, 10).map(async (group: any) => {
      const summary = group["work-summary"][0];

      const rawTitle = summary.title?.title?.value ?? null;
      const rawJournal = summary["journal-title"]?.value ?? null;
      if (!rawTitle || !rawJournal) {
        return null;
      }

      const doi =
        summary["external-ids"]?.["external-id"]?.find(
          (id: any) => id["external-id-type"] === "doi",
        )?.["external-id-value"] ?? null;

      let crossrefJournal = rawJournal;
      if (doi) {
        const fullJournalTitle = await getFullJournalTitle(doi);
        if (fullJournalTitle) {
          crossrefJournal = fullJournalTitle;
        }
      }

      return {
        title: cleanTitle(rawTitle),
        journal: cleanTitle(crossrefJournal),
        year: summary["publication-date"]?.year?.value ?? null,
        type: summary.type,
        doi,
        url: doi
          ? `https://doi.org/${doi}`
          : (summary.url?.value ?? `https://orcid.org/${orcidId}`),
      };
    }),
  );

  return (
    works
      ?.sort((a, b) => (b.year ?? "0")?.localeCompare(a.year ?? "0"))
      ?.filter(
        (c, _, self) =>
          !safeCompare(c.journal || "", "arxiv") ||
          self.filter((w) => safeCompare(w.title, c.title)).length === 1,
      )
      ?.slice(0, 5) ?? []
  );
}
