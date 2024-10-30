import esbuild from "esbuild";
const typescriptEntries = ["src/worker.ts"];
const entries = [...typescriptEntries];

export const esBuildContext: esbuild.BuildOptions = {
  sourcemap: true,
  entryPoints: entries,
  bundle: true,
  minify: false,
  outdir: "dist",
  platform: "browser",
  target: "node14",
  format: "esm",
  tsconfig: "tsconfig.json",
  loader: {
    ".ts": "ts",
  },
  logLevel: "info",
};

esbuild
  .build(esBuildContext)
  .then(() => {
    console.log("\tesbuild complete");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
