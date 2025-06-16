const fs = require('fs-extra');
const path = require('path');
const Chance = require('chance');
const chance = new Chance();

async function main() {
  const root = path.resolve(__dirname, '..');
  const spec = await fs.readJson(path.join(root, 'swagger.json'));
  const { paths = {}, components: { schemas = {} } = {} } = spec;

  const outDir = path.join(root, 'mocks');
  await fs.remove(outDir);
  await fs.ensureDir(outDir);

  // flatten an OpenAPI schema (allOf/oneOf/anyOf)
  const flatten = schema => {
    if (schema.allOf) {
      return schema.allOf.reduce((acc, s) => ({ ...flatten(acc), ...flatten(s) }), {});
    }
    if (schema.oneOf) return flatten(schema.oneOf[0]);
    if (schema.anyOf) return flatten(schema.anyOf[0]);
    return { ...schema };
  };

  const dtoStore = {};
  const pending = {};

  // build a sample object from a schema
  function buildSample(schema) {
    const s = flatten(schema);
    const sample = {};
    const missing = new Set();

    for (const [key, prop] of Object.entries(s.properties || {})) {
      const p = flatten(prop);

      // enum
      if (Array.isArray(p.enum) && p.enum.length) {
        sample[key] = p.enum[0];
        continue;
      }
      // example
      if (p.example !== undefined) {
        sample[key] = p.example;
        continue;
      }
      // $ref
      if (p.$ref) {
        const ref = p.$ref.split('/').pop();
        if (dtoStore[ref]) sample[key] = dtoStore[ref];
        else {
          missing.add(ref);
          sample[key] = null;
        }
        continue;
      }
      // date-time
      if (p.format === 'date-time') {
        sample[key] = new Date().toISOString();
        continue;
      }
      // heuristics
      if (/email/i.test(key)) {
        sample[key] = chance.email();
        continue;
      }
      if (/url|uri/i.test(key)) {
        sample[key] = chance.url();
        continue;
      }
      // primitives
      switch (p.type) {
        case 'string':
          sample[key] = chance.word();
          break;
        case 'integer':
        case 'number':
          sample[key] = chance.integer({ min: 1, max: 100 });
          break;
        case 'boolean':
          sample[key] = chance.bool();
          break;
        case 'array':
          sample[key] = [];
          break;
        case 'object':
          sample[key] = {};
          break;
        default:
          sample[key] = null;
      }
    }

    return { sample, missing };
  }

  // first pass: try to build all DTOs
  for (const [name, schema] of Object.entries(schemas)) {
    const { sample, missing } = buildSample(schema);
    if (missing.size === 0) dtoStore[name] = sample;
    else pending[name] = { schema, missing };
  }

  // resolve references iteratively
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of Object.keys(pending)) {
      const { schema } = pending[name];
      const { sample, missing } = buildSample(schema);
      if (missing.size === 0) {
        dtoStore[name] = sample;
        delete pending[name];
        changed = true;
      }
    }
  }
  if (Object.keys(pending).length) {
    console.warn('⚠️ Unresolved DTOs:', Object.keys(pending));
  }

  // write DTO files
  const dtosDir = path.join(outDir, 'dtos');
  await fs.ensureDir(dtosDir);
  for (const [name, data] of Object.entries(dtoStore)) {
    await fs.writeJson(path.join(dtosDir, `${name}.json`), data, { spaces: 2 });
  }

  // generate endpoint mocks
  for (const [route, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const segments = route.replace(/^\//, '').split('/');
      const dir = path.join(outDir, ...segments, method.toLowerCase());
      await fs.ensureDir(dir);

      // request body mock
      const reqRef = op.requestBody?.content?.['application/json']?.schema?.$ref;
      if (reqRef) {
        const dto = reqRef.split('/').pop();
        await fs.writeJson(
          path.join(dir, `${dto}-request.json`),
          dtoStore[dto] || {},
          { spaces: 2 }
        );
      }

      // responses
      for (const [status, resp] of Object.entries(op.responses || {})) {
        const resRef = resp.content?.['application/json']?.schema?.$ref;
        if (resRef) {
          const dto = resRef.split('/').pop();
          await fs.writeJson(
            path.join(dir, `${dto}-${status}.json`),
            dtoStore[dto] || {},
            { spaces: 2 }
          );
        }
      }
    }
  }

  console.log('✅ Mocks generated at', outDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});