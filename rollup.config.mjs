import typescript from "rollup-plugin-typescript2";
import yaml from "@rollup/plugin-yaml";
import { generateDtsBundle } from "rollup-plugin-dts-bundle-generator";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

const config = [
  {
    input: "src/types/index.ts",
    output: {
      dir: "types",
      format: "cjs",
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript(),
      yaml(),
      json(),
      generateDtsBundle(),
      terser(),
    ],
  },
  {
    input: "src/handlers/index.ts",
    output: {
      dir: "handlers",
      format: "cjs",
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript(),
      yaml(),
      json(),
      generateDtsBundle(),
      terser(),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      dir: "core",
      format: "cjs",
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript(),
      yaml(),
      json(),
      generateDtsBundle(),
      terser(),
    ],
  },
];

export default config;
