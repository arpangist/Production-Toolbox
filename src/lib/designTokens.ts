export interface Token {
  id: string;
  name: string;
  value: string;
}

export interface TokenSet {
  colors: Token[];
  spacing: Token[];
  radius: Token[];
  shadows: Token[];
}

export const EMPTY_TOKEN_SET: TokenSet = { colors: [], spacing: [], radius: [], shadows: [] };

function slug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "token";
}

const CATEGORY_PREFIX: Record<keyof TokenSet, string> = {
  colors: "color",
  spacing: "spacing",
  radius: "radius",
  shadows: "shadow",
};

function eachToken(tokens: TokenSet): { prefix: string; token: Token }[] {
  const result: { prefix: string; token: Token }[] = [];
  (Object.keys(tokens) as (keyof TokenSet)[]).forEach((category) => {
    for (const token of tokens[category]) result.push({ prefix: CATEGORY_PREFIX[category], token });
  });
  return result;
}

export function tokensToCss(tokens: TokenSet): string {
  const lines = eachToken(tokens).map(({ prefix, token }) => `  --${prefix}-${slug(token.name)}: ${token.value};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function tokensToScss(tokens: TokenSet): string {
  return eachToken(tokens)
    .map(({ prefix, token }) => `$${prefix}-${slug(token.name)}: ${token.value};`)
    .join("\n");
}

export function tokensToJson(tokens: TokenSet): string {
  const obj: Record<string, Record<string, string>> = {};
  (Object.keys(tokens) as (keyof TokenSet)[]).forEach((category) => {
    obj[category] = Object.fromEntries(tokens[category].map((t) => [slug(t.name), t.value]));
  });
  return JSON.stringify(obj, null, 2);
}

let idCounter = 0;
export function nextTokenId(): string {
  idCounter += 1;
  return `token-${idCounter}-${Date.now()}`;
}
