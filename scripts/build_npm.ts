// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: [{
    kind: "bin",
    name: "mahjong-tui", // command name
    path: "./main.tsx",
  }],
  scriptModule: false,
  declaration: false,
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@k-jun/mahjong-tui",
    version: Deno.args[0],
    description: "Mahjong TUI client",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/k-jun/aubrietia.git",
    },
    bugs: {
      url: "https://github.com/k-jun/aubrietia/issues",
    },
    dependencies: {
      "react": "^19.1.0",
      "ink": "^4.3.0",
      "socket.io-client": "^4.7.4",
    },
    devDependencies: {
      "@types/react": "^18.2.0",
    },
  },
  // postBuild() {
  //   // steps to run after building and before running the tests
  //   Deno.copyFileSync("LICENSE", "npm/LICENSE");
  //   Deno.copyFileSync("README.md", "npm/README.md");
  // },
});
