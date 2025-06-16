const fs = require('fs-extra');
const path = require('path');
const $RefParser = require('@apidevtools/json-schema-ref-parser');
const jsf = require('json-schema-faker');

async function main() {
    jsf.option({
        useExamplesValue: true,
        alwaysFakeOptionals: true
    });

    const swagger = await $RefParser.dereference('swagger.json');

    const outDir = path.resolve('mocks');
    await fs.emptyDir(outDir);

    for (const [route, methods] of Object.entries(swagger.paths)) {
        for (const [method, op] of Object.entries(methods)) {
            const segments = route.replace(/^\//, '').split('/');
            const dir = path.join(outDir, ...segments, method.toLowerCase());
            await fs.ensureDir(dir);

            if (op.requestBody?.content?.['application/json']?.schema) {
                const schema = op.requestBody.content['application/json'].schema;
                const sample = jsf.generate(schema);
                await fs.writeJson(path.join(dir, 'sample-request.json'), sample, { spaces: 2 });
            }

            if (op.responses) {
                for (const [status, resp] of Object.entries(op.responses)) {
                    const schema = resp.content?.['application/json']?.schema;
                    if (schema) {
                        const sample = jsf.generate(schema);
                        const file = `sample-response-${status}.json`;
                        await fs.writeJson(path.join(dir, file), sample, { spaces: 2 });
                    }
                }
            }
        }
    }

    console.log('✅ Route-based JSON files generated under /mocks');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});