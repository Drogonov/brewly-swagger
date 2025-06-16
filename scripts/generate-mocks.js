const fs = require('fs-extra');
const path = require('path');
const Chance = require('chance');
const chance = new Chance();

async function main() {
  // Define project root and paths
  const projectRoot = path.resolve(__dirname, '..');
  const specPath = path.join(projectRoot, 'swagger.json');
  const outputDir = path.join(projectRoot, 'mocks');

  // Clean up previous mocks
  await fs.remove(outputDir);

  // Load the raw OpenAPI spec
  const rawSpec = await fs.readJson(specPath);
  const paths = rawSpec.paths || {};
  const schemas = rawSpec.components?.schemas || {};

  // Helpers for schema composition and sample building
  function flattenSchema(schema = {}) {
    if (schema.allOf) {
      return schema.allOf.reduce((acc, subschema) => {
        const flat = flattenSchema(subschema);
        return {
          ...acc,
          ...flat,
          properties: { ...(acc.properties || {}), ...(flat.properties || {}) },
          required: Array.from(new Set([...(acc.required || []), ...(flat.required || [])])),
        };
      }, { ...schema, allOf: undefined });
    }
    if (schema.oneOf) return flattenSchema(schema.oneOf[0]);
    if (schema.anyOf) return flattenSchema(schema.anyOf[0]);
    return schema;
  }

  function buildSample(schema) {
    schema = flattenSchema(schema);
    const sample = {};
    const missing = new Set();
    const props = schema.properties || {};

    for (const [propName, rawProp] of Object.entries(props)) {
      const prop = flattenSchema(rawProp);

      // Enum: pick first
      if (Array.isArray(prop.enum) && prop.enum.length) {
        sample[propName] = prop.enum[0];
        continue;
      }
      // Example value
      if (prop.example !== undefined) {
        sample[propName] = prop.example;
        continue;
      }
      // Reference to another DTO
      if (prop.$ref) {
        const ref = prop.$ref.replace('#/components/schemas/', '');
        if (mainDict[ref]) sample[propName] = mainDict[ref];
        else {
          missing.add(ref);
          sample[propName] = null;
        }
        continue;
      }
      // Array of refs
      if (prop.type === 'array' && prop.items?.$ref) {
        const ref = prop.items.$ref.replace('#/components/schemas/', '');
        if (mainDict[ref]) sample[propName] = [mainDict[ref]];
        else {
          missing.add(ref);
          sample[propName] = [];
        }
        continue;
      }
      // Date-time format
      if (prop.format === 'date-time') {
        sample[propName] = new Date().toISOString();
        continue;
      }
      // Heuristic: email, url
      if (/email/i.test(propName)) {
        sample[propName] = chance.email();
        continue;
      }
      if (/url|uri/i.test(propName)) {
        sample[propName] = chance.url();
        continue;
      }
      // Primitive types with random data, number and integer both integer
      switch (prop.type) {
        case 'string':
          sample[propName] = chance.word();
          break;
        case 'integer':
          sample[propName] = chance.integer({ min: 1, max: 100 });
          break;
        case 'number':
          // treat number as integer to avoid floats
          sample[propName] = chance.integer({ min: 1, max: 100 });
          break;
        case 'boolean':
          sample[propName] = chance.bool();
          break;
        case 'array':
          sample[propName] = [];
          break;
        case 'object':
          sample[propName] = {};
          break;
        default:
          sample[propName] = null;
      }
    }

    return { sample, missing };
  }

  // 1) Generate DTO samples
  const mainDict = {};
  const tempDict = {};

  for (const [name, schema] of Object.entries(schemas)) {
    const { sample, missing } = buildSample(schema);
    if (!missing.size) mainDict[name] = sample;
    else tempDict[name] = { schema, missing };
  }

  let progress = true;
  while (progress && Object.keys(tempDict).length) {
    progress = false;
    for (const [name, { schema }] of Object.entries(tempDict)) {
      const { sample, missing } = buildSample(schema);
      if (!missing.size) {
        mainDict[name] = sample;
        delete tempDict[name];
        progress = true;
      }
    }
  }

  if (Object.keys(tempDict).length) {
    console.warn('⚠️ Unresolved DTOs:', Object.keys(tempDict));
  }

  // 2) Write DTO files
  const dtoDir = path.join(outputDir, 'dtos');
  await fs.ensureDir(dtoDir);
  for (const [name, sample] of Object.entries(mainDict)) {
    await fs.writeJson(path.join(dtoDir, `${name}.json`), sample, { spaces: 2 });
  }

  // 3) Create mocks per endpoint
  for (const [route, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const segments = route.replace(/^\//, '').split('/');
      const dir = path.join(outputDir, ...segments, method.toLowerCase());
      await fs.ensureDir(dir);

      // Request mock postfix
      const reqRef = op.requestBody?.content?.['application/json']?.schema?.$ref;
      if (reqRef) {
        const dto = reqRef.split('/').pop();
        await fs.writeJson(path.join(dir, `${dto}-request.json`), mainDict[dto] || {}, { spaces: 2 });
      }

      // Response mocks with status suffix
      for (const [status, resp] of Object.entries(op.responses || {})) {
        const resRef = resp.content?.['application/json']?.schema?.$ref;
        if (resRef) {
          const dto = resRef.split('/').pop();
          await fs.writeJson(path.join(dir, `${dto}-${status}.json`), mainDict[dto] || {}, { spaces: 2 });
        }
      }
    }
  }

  console.log('✅ Mockoon-compatible files created at', outputDir);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});