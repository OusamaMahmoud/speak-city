import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: require("path").join(__dirname, "../.."),
  transpilePackages: ["three"],
};
export default config;
