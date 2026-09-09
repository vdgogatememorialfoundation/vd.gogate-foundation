import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2", "figure", "figcaption", "iframe", "span", "u"],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
    "*": ["class", "style", "dir", "lang"],
  },
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "www.google.com"],
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }, true),
  },
};

/** Sanitize editor HTML before storing/rendering. */
export function cleanHtml(input: string | null | undefined): string {
  return input ? sanitizeHtml(input, OPTIONS) : "";
}

export function stripHtml(input: string | null | undefined, max = 200): string {
  const text = sanitizeHtml(input ?? "", { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
