export interface ContentSelector {
  selector: string;
  default?: string;
}

export interface ContentSelectors {
  hierarchy: ContentSelector[];
  text: ContentSelector;
}

export interface SiteSearchConfig {
  siteStartCmd?: string;
  siteOrigin: string;
  siteReadyProbe: string;
  outputPath: string;
  allowedPaths?: string;
  selectors: ContentSelectors;
}

export interface IndexedRecord {
  hierarchy: (string | null)[];
  text: string;
  anchor: string | null;
}

export type IndexedDocument = IndexedRecord & { path: string };
