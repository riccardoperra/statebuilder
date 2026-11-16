import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcDir = join(import.meta.dirname, '../src');
const importsSolid =
  /\bfrom\s+['"]solid-js(\/[^'"]*)?['"]|\bimport\s*\(?\s*['"]solid-js(\/[^'"]*)?['"]/;

function solidImporters(): string[] {
  return readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.[cm]?tsx?$/.test(file))
    .filter((file) =>
      importsSolid.test(readFileSync(join(srcDir, file), 'utf8')),
    )
    .map((file) => relative(srcDir, join(srcDir, file)).split('\\').join('/'))
    .sort();
}

describe('reactivity boundary', () => {
  it('reactivity.ts is the only container source file that imports solid-js', () => {
    expect(solidImporters()).toEqual(['reactivity.ts']);
  });
});
