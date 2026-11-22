import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Resolve imports with the same paths and aliases as the application compiler.
const root = fileURLToPath(new URL("../", import.meta.url));
const src = path.join(root, "src");
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);

function moduleOf(file) {
  const [layer, feature] = path.relative(src, file).split(path.sep);
  return layer === "features" ? `features/${feature}` : layer;
}

test("shared code stays independent and features compose without import cycles", () => {
  const dependencies = new Map();
  const files = ts.sys.readDirectory(src, [".ts", ".tsx"]);
  for (const file of files) {
    const owner = moduleOf(file);
    for (const entry of ts.preProcessFile(readFileSync(file, "utf8"), true, true).importedFiles) {
      const target = ts.resolveModuleName(entry.fileName, file, options, ts.sys).resolvedModule;
      if (!target?.resolvedFileName.startsWith(src + path.sep)) continue;
      const dependency = moduleOf(target.resolvedFileName);
      if (dependency === owner) continue;
      assert.ok(dependency !== "app", `${file} imports a route via ${entry.fileName}`);
      if (owner === "lib" || owner === "ui") {
        assert.ok(!dependency.startsWith("features/"), `${file} depends on feature ${dependency}`);
      }
      if (!dependencies.has(owner)) dependencies.set(owner, new Set());
      dependencies.get(owner).add(dependency);
    }
  }

  const visited = new Set();
  function visit(owner, chain) {
    assert.ok(!chain.includes(owner), `Import cycle: ${[...chain, owner].join(" -> ")}`);
    if (visited.has(owner)) return;
    for (const dependency of dependencies.get(owner) ?? []) visit(dependency, [...chain, owner]);
    visited.add(owner);
  }
  for (const owner of dependencies.keys()) visit(owner, []);
});
