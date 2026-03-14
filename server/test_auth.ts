import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    console.log('--- Testing Auth ---');
    const projectId = (process.env.GOOGLE_PROJECT_ID || '').trim().replace(/^['"]|['"]$/g, '');
    const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || '').trim().replace(/^['"]|['"]$/g, '');
    let privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim().replace(/^['"]|['"]$/g, '');

    // Final normalization
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

    console.log('Project:', projectId);
    console.log('Email:', clientEmail);
    console.log('Key length:', privateKey.length);
    console.log('Key starts with:', privateKey.substring(0, 30));

    try {
        const vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1',
            googleAuthOptions: {
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey,
                }
            }
        });

        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        console.log('Attempting to list models or do a simple probe...');
        // generateContent is a good test
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
        });
        console.log('Auth successful! Response received.');
    } catch (error: any) {
        console.error('Auth check failed:');
        console.error(error.message);
        if (error.stack) console.error(error.stack);
    }
}

test();
