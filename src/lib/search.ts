import { CATEGORY_LABELS, type ToolDefinition } from "../types/tool";

export interface SearchResult {
  tool: ToolDefinition;
  score: number;
}

function scoreField(query: string, field: string, weight: number): number {
  const normalized = field.toLowerCase();
  if (normalized === query) return weight * 2;
  if (normalized.startsWith(query)) return weight * 1.5;
  if (normalized.includes(query)) return weight;
  return isSubsequence(query, normalized) ? weight * 0.4 : 0;
}

// Cheap fuzzy fallback: every query character must appear in order.
function isSubsequence(query: string, target: string): boolean {
  let i = 0;
  for (let j = 0; j < target.length && i < query.length; j++) {
    if (target[j] === query[i]) i++;
  }
  return i === query.length;
}

export function searchTools(tools: ToolDefinition[], rawQuery: string): SearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return tools.map((tool) => ({ tool, score: 0 }));

  const results: SearchResult[] = [];
  for (const tool of tools) {
    let score = scoreField(query, tool.name, 3);
    score += scoreField(query, CATEGORY_LABELS[tool.category], 2);
    for (const keyword of tool.keywords) {
      score = Math.max(score, scoreField(query, keyword, 1.5));
    }
    score = Math.max(score, scoreField(query, tool.description, 0.5));
    if (score > 0) results.push({ tool, score });
  }

  return results.sort((a, b) => b.score - a.score);
}
