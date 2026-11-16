import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);

for (const [subpath, target] of Object.entries(manifest.exports)) {
  const file = target.import ?? target.default;
  const module = await import(new URL(`../${file}`, import.meta.url).href);
  assert.ok(
    Object.keys(module).length > 0,
    `"${subpath}" (${file}) loads in Node without a bundler and has exports`,
  );
  console.log(`ok ${subpath}`);
}
