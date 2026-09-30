import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../public/models/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
const ids = ['body', 'brain', 'heart', 'lungs', 'liver', 'stomach', 'pancreas', 'kidneys', 'intestines', 'skeleton', 'vascular'];
let totalBytes = 0;
for (const id of ids) {
  test(`${id}: valid bounded GLB with actual selectable geometry`, () => {
    const bytes = readFileSync(new URL(`${id}.glb`, root));
    totalBytes += bytes.length;
    assert.equal(bytes.toString('ascii', 0, 4), 'glTF', 'Git LFS pointers and HTML must not be shipped as models');
    assert.equal(bytes.readUInt32LE(4), 2);
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.equal(json.meshes.length, 1, 'Coverage is explicitly described as merged model groups');
    assert(json.nodes.some(node => node.mesh === 0));
    for (const primitive of json.meshes[0].primitives) {
      const position = json.accessors[primitive.attributes.POSITION];
      assert(position.count > 0);
      for (let axis = 0; axis < 3; axis++) {
        assert(Number.isFinite(position.min[axis]) && Number.isFinite(position.max[axis]));
        assert(position.max[axis] > position.min[axis]);
        assert(Math.abs(position.min[axis]) < 3 && Math.abs(position.max[axis]) < 3, 'Model must use the shared body coordinate frame');
      }
    }
    assert(bytes.length < 600_000, 'Keep each model below the current mobile download budget');
    if (manifest[id]?.sha256) assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest[id].sha256);
  });
}
test('full model set stays below 3 MB and retains source attribution', () => {
  assert(totalBytes < 3_000_000);
  assert.match(readFileSync(new URL('ATTRIBUTION.md', root), 'utf8'), /Database Center for Life Science/);
  assert.match(readFileSync(new URL('LICENSE-source.txt', root), 'utf8'), /CC BY-SA/);
});
