/**
 * TipTap Entry Point for Browser Bundle
 * Exports all TipTap modules for use in editor-core.js
 */

// Core
export { Editor, Node, Mark, Extension } from "@tiptap/core";

// Starter Kit (includes basic functionality)
export { default as StarterKit } from "@tiptap/starter-kit";

// Extensions
export { default as Image } from "@tiptap/extension-image";
export { default as Placeholder } from "@tiptap/extension-placeholder";
export { default as Link } from "@tiptap/extension-link";
export { default as TextAlign } from "@tiptap/extension-text-align";
export { default as Underline } from "@tiptap/extension-underline";
export { default as BubbleMenu } from "@tiptap/extension-bubble-menu";
export { default as FloatingMenu } from "@tiptap/extension-floating-menu";
