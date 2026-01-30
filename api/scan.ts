import { VertexAI } from '@google-cloud/vertexai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const projectId = process.env.GOOGLE_PROJECT_ID;
        const location = 'us-central1';

        // Auth configuration
        const vertexAI = new VertexAI({
            project: projectId,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: process.env.GOOGLE_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }
            }
        });

        const model = 'gemini-2.5-flash';
        const generativeModel = vertexAI.getGenerativeModel({
            model: model,
        });

        // Clean base64 data
        const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        const request = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: "Extract all text from this image exactly. whitout any comments or explanation." },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
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
    } catch (error) {
        console.error('OCR Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
}
