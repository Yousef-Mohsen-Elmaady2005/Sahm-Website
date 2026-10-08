import React from "react";
import { t } from "../i18n";

const allowedTags = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "strong", "b", "em", "i",
  "u", "ul", "ol", "li", "br", "span", "div",
]);

const tagClasses = {
  h1: "mb-4 text-2xl font-bold text-gray-900 sm:text-3xl",
  h2: "mb-4 text-xl font-bold text-gray-900 sm:text-2xl",
  h3: "mb-3 text-lg font-bold text-gray-900 sm:text-xl",
  h4: "mb-3 text-lg font-bold text-gray-900",
  p: "mb-3 leading-7 text-gray-600 last:mb-0",
  strong: "font-bold text-gray-900",
  b: "font-bold text-gray-900",
  ul: "my-3 list-disc space-y-2 pr-6 text-gray-600",
  ol: "my-3 list-decimal space-y-2 pr-6 text-gray-600",
  li: "leading-7",
};

function renderNode(node, key) {
  if (node.nodeType === 3) return t(node.textContent);
  if (node.nodeType !== 1) return null;

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes).map((child, index) =>
    renderNode(child, `${key}-${index}`)
  );

  // Keep text from unsupported tags, but never pass their attributes through.
  if (!allowedTags.has(tag)) return children;
  if (tag === "br") return React.createElement("br", { key });

  return React.createElement(
    tag,
    { key, className: tagClasses[tag] || undefined },
    ...children
  );
}

export default function RichText({ html, className = "" }) {
  if (!html || typeof html !== "string") return null;

  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (
    <div className={className}>
      {Array.from(parsed.body.childNodes).map((node, index) => renderNode(node, `html-${index}`))}
    </div>
  );
}
