
// Re-export Vue (with compiler)
export * from 'vue/dist/vue.esm-bundler.js';

// Re-export Marked
export { marked } from 'marked';

// Re-export DOMPurify
import DOMPurify from 'dompurify';
export { DOMPurify };
export default DOMPurify;
