export interface ContentSelector {
  selector: string;
  default?: string;
}

export interface ContentRule {
  test?: string;
  hierarchy: ContentSelector[];
  text: ContentSelector;
}

export interface SiteSearchConfig {
  siteStartCmd?: string;
  siteOrigin: string;
  startUrl: string;
  outputPath: string;
  rules: ContentRule[];
}

export interface IndexedRecord {
  hierarchy: (string | null)[];
  text: string;
  anchor: string | null;
}

export type IndexedDocument = IndexedRecord & { path: string };
