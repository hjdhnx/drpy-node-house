import { build } from "bun";
import { rm } from "node:fs/promises";

console.log("Building vendor bundle...");

// Clean dist
await rm("./public/dist", { recursive: true, force: true });

const result = await build({
  entrypoints: ["./public/js/vendor.js"],
  outdir: "./public/dist",
  minify: true,
  naming: "vendor.bundle.js", // Output filename
  target: "browser",
  format: "esm", // Output format
  define: {
    __VUE_OPTIONS_API__: "true",
    __VUE_PROD_DEVTOOLS__: "false",
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
  },
});

if (result.success) {
  console.log("Vendor build successful!");
} else {
  console.error("Build failed!");
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}
