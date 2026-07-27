export interface Work {
    title: string;
    journal: string | null;
    year: string | null;
    type: string;
    doi: string | null;
    url: string;
}

export const ORCID_ID = "0009-0004-6351-556X";

export async function fetchPublications(): Promise<Work[]> {
    const res = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
        headers: { Accept: "application/json" },
    });

    if (!res.ok) return [];

    const data = await res.json();

    if (!data.group || !Array.isArray(data.group)) return [];

    const works: Work[] = data.group.map((group: any) => {
        const summary = group["work-summary"][0];
        const doi =
            summary["external-ids"]?.["external-id"]?.find(
                (id: any) => id["external-id-type"] === "doi",
            )?.["external-id-value"] ?? null;

        return {
            title: summary.title?.title?.value ?? "Untitled",
            journal: summary["journal-title"]?.value ?? null,
            year: summary["publication-date"]?.year?.value ?? null,
            type: summary.type,
            doi,
            url: doi
                ? `https://doi.org/${doi}`
                : (summary.url?.value ?? `https://orcid.org/${ORCID_ID}`),
        };
    });

    return works?.sort((a, b) => (b.year ?? "0")?.localeCompare(a.year ?? "0"))?.slice(0, 5) ?? [];
}