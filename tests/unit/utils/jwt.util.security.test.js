import { describe, test, expect } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

const runNodeImport = ({ modulePath, env = {}, scriptSuffix = '' }) => {
  const code = `import '${modulePath}'; ${scriptSuffix}`;

  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: projectRoot,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });
};

describe('jwt.util.js security configuration', () => {
  test('fails fast in production when JWT_SECRET is missing', () => {
    const child = runNodeImport({
      modulePath: './src/utils/jwt.util.js',
      env: {
        NODE_ENV: 'production',
        JWT_SECRET: '',
      },
    });

    expect(child.status).not.toBe(0);
    expect(`${child.stderr}${child.stdout}`).toContain('JWT_SECRET is required in production');
  });

  test('warns in development and keeps default secret fallback', () => {
    const child = runNodeImport({
      modulePath: './src/utils/jwt.util.js',
      env: {
        NODE_ENV: 'development',
        JWT_SECRET: '',
      },
      scriptSuffix: "console.log('MODULE_LOADED_OK');",
    });

    expect(child.status).toBe(0);
    expect(child.stdout).toContain('MODULE_LOADED_OK');
    expect(child.stderr).toContain('WARNING: Using default JWT_SECRET for development. DO NOT use in production!');
  });
});
