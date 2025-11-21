import Mustache from "mustache";
export function renderTemplate(body, data) {
    return Mustache.render(body, data);
}
