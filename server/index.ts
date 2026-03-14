import express from 'express';
import cors from 'cors';
import { VertexAI } from '@google-cloud/vertexai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5173; // Changed back to 5173 because we're mimicking your Render backend server here if Vercel doesn't work

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/scan', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const projectId = (process.env.GOOGLE_PROJECT_ID || '').trim().replace(/^['"]|['"]$/g, '');
        const location = 'us-central1';
        const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || '').trim().replace(/^['"]|['"]$/g, '');
        let privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim().replace(/^['"]|['"]$/g, '');

        if (!projectId || !clientEmail || !privateKey) {
            const missing = [];
            if (!projectId) missing.push('GOOGLE_PROJECT_ID');
            if (!clientEmail) missing.push('GOOGLE_CLIENT_EMAIL');
            if (!privateKey) missing.push('GOOGLE_PRIVATE_KEY');
            
            console.error('Missing required environment variables:', missing.join(', '));
            return res.status(500).json({
                error: `Server configuration error: Missing Google Cloud credentials (${missing.join(', ')})`
            });
        }

        // Robust private key normalization
        privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

        console.log('--- OCR Backend Auth Attempt ---');
        console.log('Project ID:', projectId);
        console.log('Client Email:', clientEmail);
        console.log('Key length:', privateKey.length);
        console.log('Key starts with:', privateKey.substring(0, 40).replace(/\n/g, '[LF]'));

        let vertexAI;
        try {
            vertexAI = new VertexAI({
                project: projectId,
                location: location,
                googleAuthOptions: {
                    credentials: {
                        client_email: clientEmail,
                        private_key: privateKey,
                    }
                }
            });
            console.log('VertexAI initialized successfully (constructor reached)');
        } catch (initError: any) {
            console.error('Failed to initialize VertexAI client:', initError);
            throw initError;
        }

        const model = 'gemini-2.5-flash';
        const generativeModel = vertexAI.getGenerativeModel({ model });

        const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
        const base64Data = image.includes(';base64,') ? image.split(';base64,').pop() : image;

        const request: any = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Extract all text from this image exactly. Without any comments or explanation." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0,
            }
        };

        const result = await generativeModel.generateContent(request);
        const response = await result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return res.status(200).json({ success: true, text });
    } catch (error: any) {
        console.error('OCR Error detail:', error);
        
        let userMessage = error.message;
        if (error.message.includes('DECODER routines::unsupported')) {
            userMessage = "Google Cloud Private Key format is invalid. The key in your .env file might be corrupted, incomplete, or missing characters. Please re-copy it from your service account JSON file.";
        } else if (error.message.includes('Unable to authenticate your request')) {
            userMessage = "Google Cloud Authentication failed. Please check your credentials in .env and ensure the Vertex AI API is enabled.";
        }

        return res.status(500).json({
            success: false,
            error: userMessage,
            details: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Express Mock API Server running on port ${PORT}`);
});
