import Mustache from "mustache";

export function renderTemplate(body: string, data: Record<string, string>) {
  return Mustache.render(body, data);
}
