const fs = require('fs-extra');

(async () => {
    const spec = await fs.readJson('swagger.json');
    const paths = spec.paths || {};

    Object.entries(paths).forEach(([route, methods]) => {
        Object.entries(methods).forEach(([method, op]) => {
            Object.entries(op.responses || {}).forEach(([code, resp]) => {
                const ref = resp.content?.['application/json']?.schema?.$ref;
                if (ref) {
                    const name = ref.split('/').pop();
                    // build the file path relative to project root
                    const filePath = `./mocks/${route.slice(1).replace(/\//g, '/')}/${method}/${name}-${code}.json`;

                    resp.content['application/json'].examples = {
                        [name]: { $ref: filePath }
                    };
                }
            });
        });
    });

    await fs.writeJson('swagger-linked.json', spec, { spaces: 2 });
    console.log('✅ Created swagger-linked.json');
})();