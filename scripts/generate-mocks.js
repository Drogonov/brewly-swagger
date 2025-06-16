const fs = require('fs-extra');
const path = require('path');

async function main() {
  // Define project root and paths
  const projectRoot = path.resolve(__dirname, '..');
  const specPath = path.join(projectRoot, 'swagger.json');
  const outputDir = path.join(projectRoot, 'mocks');

  // Load the raw OpenAPI spec
  const rawSpec = await fs.readJson(specPath);

  // 1) Create directories for each route/method
  for (const [route, methods] of Object.entries(rawSpec.paths || {})) {
    for (const [method] of Object.entries(methods)) {
      const methodName = method.toLowerCase();
      const segments = route.replace(/^\//, '').split('/');
      const dir = path.join(outputDir, ...segments, methodName);
      await fs.ensureDir(dir);
    }
  }
  console.log('✅ Directories created at', outputDir);

  // 2) Prepare DTO generation
  const schemas = rawSpec.components?.schemas || {};
  const mainDict = {};               // Fully resolved DTOs
  const tempDict = {};               // DTOs waiting on dependencies

  // Helper: build sample and track missing refs
  function buildSample(schema) {
    const sample = {};
    const missing = new Set();
    const props = schema.properties || {};

    for (const [propName, propSchema] of Object.entries(props)) {
      // Example has highest priority
      if (propSchema.example !== undefined) {
        sample[propName] = propSchema.example;
        continue;
      }
      // Direct $ref to another DTO
      if (propSchema.$ref) {
        const refName = propSchema.$ref.replace('#/components/schemas/', '');
        if (mainDict[refName]) {
          sample[propName] = mainDict[refName];
        } else {
          missing.add(refName);
          sample[propName] = null;
        }
        continue;
      }
      // Array of refs
      if (propSchema.type === 'array' && propSchema.items?.$ref) {
        const refName = propSchema.items.$ref.replace('#/components/schemas/', '');
        if (mainDict[refName]) sample[propName] = [ mainDict[refName] ];
        else {
          missing.add(refName);
          sample[propName] = [];
        }
        continue;
      }
      // Primitive types
      switch (propSchema.type) {
        case 'string':    sample[propName] = '';    break;
        case 'number':
        case 'integer':   sample[propName] = 0;     break;
        case 'boolean':   sample[propName] = false; break;
        case 'array':     sample[propName] = [];    break;
        case 'object':    sample[propName] = {};    break;
        default:          sample[propName] = null;  break;
      }
    }

    return { sample, missing };
  }

  // First pass: fill what we can, else to temp
  for (const [dtoName, schema] of Object.entries(schemas)) {
    const { sample, missing } = buildSample(schema);
    if (missing.size === 0) {
      mainDict[dtoName] = sample;
    } else {
      tempDict[dtoName] = { schema, missing };
    }
  }

  // Resolve dependencies iteratively
  let progress = true;
  while (progress && Object.keys(tempDict).length > 0) {
    progress = false;

    for (const [dtoName, { schema }] of Object.entries(tempDict)) {
      const { sample, missing } = buildSample(schema);
      if (missing.size === 0) {
        mainDict[dtoName] = sample;
        delete tempDict[dtoName];
        progress = true;
      } else {
        tempDict[dtoName].missing = missing;
      }
    }
  }

  if (Object.keys(tempDict).length > 0) {
    console.warn('⚠️ Could not resolve all DTOs due to circular or missing refs:', Object.keys(tempDict));
  }

  // 3) Print the DTO JSON dictionary
  console.log('📦 DTO JSONs:', JSON.stringify(mainDict, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});