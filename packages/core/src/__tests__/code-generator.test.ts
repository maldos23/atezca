import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { CodeGenerator } from '../generator/code-generator.js';
import type { InterpretationResult } from '../types/index.js';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'atezca-gen-'));
}

describe('CodeGenerator', () => {
  it('generates code with actions and ssl note', () => {
    const generator = new CodeGenerator({
      url: 'https://example.com',
      timeout: 123,
      disableSSL: true,
    });

    const interpretations: InterpretationResult[] = [
      {
        cached: false,
        timestamp: 1,
        command: { actionType: 'interact', description: "click 'Login'", timestamp: 1 },
        actions: [
          { action: 'click', selector: "role=button[name='Login']" },
          { action: 'type', selector: "input[name='email']", value: "a'b\"c" },
          { action: 'expect', selector: 'text=Success', assertionType: 'visible', timeout: 500 },
        ],
      },
    ];

    const code = generator.generateCode(interpretations);
    expect(code).toContain("import { test, expect } from '@playwright/test';");
    expect(code).toContain('SSL certificate validation is disabled');
    expect(code).toContain("await page.goto('https://example.com');");
    expect(code).toContain("// interact: click 'Login'");
    expect(code).toContain("await page.locator('role=button[name=\\'Login\\']').click");
    expect(code).toContain("fill('a\\'b\\\"c'");
    expect(code).toContain('toBeVisible');
  });

  it('generates playwright config including ignoreHTTPSErrors when disableSSL is true', () => {
    const generator = new CodeGenerator({ url: 'https://example.com', disableSSL: true });
    const config = generator.generatePlaywrightConfig();

    expect(config).toContain("baseURL: 'https://example.com'");
    expect(config).toContain('ignoreHTTPSErrors: true');
  });

  it('saves a generated test file', async () => {
    const dir = makeTempDir();
    const generator = new CodeGenerator({ url: 'https://example.com', outputDir: dir });

    const interpretations: InterpretationResult[] = [
      {
        cached: true,
        timestamp: 1,
        command: { actionType: 'wait', description: 'wait a bit', timestamp: 1 },
        actions: [{ action: 'wait', selector: 'body', condition: 'attached', timeout: 50 }],
      },
    ];

    const filePath = await generator.saveTestFile(interpretations, 'unit.spec.ts');
    expect(filePath).toBe(path.join(dir, 'unit.spec.ts'));
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toContain('Generated E2E Test');

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
