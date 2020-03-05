const core = require('@actions/core');
const fs = require('fs');
(global as any).fetch = require('node-fetch'); // Polyfill for graph client
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialsAuthProvider } from './auth';

async function main() {
    try {
        const name = core.getInput('name')
        const file = core.getInput('file');
        const password = core.getInput('password');
        const tenant = core.getInput('tenant');
        const clientId = core.getInput('clientId');
        const clientSecret = core.getInput('clientSecret');

        const client = Client.initWithMiddleware({
            authProvider: new ClientCredentialsAuthProvider(tenant, clientId, clientSecret),
            defaultVersion: "beta"
        });
    
        let buffer = Buffer.from(fs.readFileSync(file));
        let fileBase64 = buffer.toString("base64");

        try {
            // Create in case it does not already exist
            await client.api("trustFramework/keySets").create({
                id: name
            });
        } catch { }

        // Then upload the certificate
        await client.api(`trustFramework/keySets/${name}/uploadPkcs12`).post({
            key: fileBase64,
            password: password
        });

        core.info("Uploaded certificate using Microsoft Graph");
    } catch (error) {
        let errorText = error.message ?? error;
        core.error('Action failed: ' + errorText);
        core.setFailed();
    }
}

main();
