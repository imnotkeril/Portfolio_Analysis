import templatesJson from "@/data/builtin-templates.json";
import type { TemplateDetail, TemplateSummary } from "@/lib/api";

type RawEntry = {
  title: string;
  description: string;
  assets: Array<{
    ticker: string;
    weight: number;
    name?: string;
    sector?: string;
    asset_class?: string;
  }>;
  tags?: string[];
};

const DATA = templatesJson as Record<string, RawEntry>;

export function builtinTemplateSummaries(): TemplateSummary[] {
  return Object.entries(DATA).map(([id, v]) => ({
    id,
    title: v.title,
    description: v.description,
    asset_count: v.assets.length,
  }));
}

export function builtinTemplateDetail(id: string): (TemplateDetail & { tags?: string[] }) | null {
  const v = DATA[id];
  if (!v) return null;
  return {
    title: v.title,
    description: v.description,
    assets: v.assets.map((a) => ({ ...a })),
    tags: v.tags,
  };
}
