import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function inventory(directory, prefix = '') {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, await inventory(join(directory, entry.name), relative + '/'));
    else if (relative !== 'release.json') result[relative] = hash(await readFile(join(directory, entry.name)));
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
let commit = process.env.GITHUB_SHA;
if (!commit) {
  try { commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { commit = 'uncommitted'; }
}
if (process.env.CI && !/^[0-9a-f]{40}$/.test(commit)) throw new Error('CI release requires a full commit SHA');
const files = await inventory(root);
for (const required of ['index.html', 'staticwebapp.config.json', 'favicon.svg']) {
  if (!files[required]) throw new Error(`Missing artifact: ${required}`);
}
const html = await readFile(join(root, 'index.html'), 'utf8');
for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
  if (!files[asset[1].slice(1)]) throw new Error(`Missing referenced asset: ${asset[1]}`);
}
if (!Object.keys(files).some((name) => /^assets\/comparison\.worker-.*\.js$/.test(name))) throw new Error('Missing comparison worker');
if (process.argv.includes('--verify')) {
  const release = JSON.parse(await readFile(join(root, 'release.json'), 'utf8'));
  if (release.commit !== commit || JSON.stringify(release.files) !== JSON.stringify(files)) throw new Error('Release identity or asset integrity mismatch');
  console.log(`Verified TFL ${commit}: ${Object.keys(files).length} artifact files`);
} else {
  await writeFile(join(root, 'release.json'), JSON.stringify({ application: 'tfl-aserdargun-com', commit, builtAt: new Date().toISOString(), files }, null, 2) + '\n');
  console.log(`Stamped TFL ${commit}`);
}
