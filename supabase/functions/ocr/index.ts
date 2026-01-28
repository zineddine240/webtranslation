
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PEM Import helper
async function importKey(pem: string) {
    try {
        // remove header, footer, and newlines
        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');

        const binaryDerString = atob(pemContents);
        const binaryDer = new Uint8Array(binaryDerString.length);

        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        return await crypto.subtle.importKey(
            "pkcs8",
            binaryDer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
            },
            true,
            ["sign"]
        );
    } catch (e) {
        throw new Error("Failed to import private key: " + e.message);
    }
}

async function getAccessToken(serviceAccount: any) {
    const key = await importKey(serviceAccount.private_key);

    const jwt = await create({ alg: "RS256", typ: "JWT" }, {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
        exp: getNumericDate(60 * 60), // 1 hour
        iat: getNumericDate(0),
    }, key);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await response.json();
    return data.access_token;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { image } = await req.json();

        if (!image) throw new Error('No image provided');

        // Get the full SERVICE ACCOUNT JSON from secrets
        const serviceAccountStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
        if (!serviceAccountStr) throw new Error('GOOGLE_SERVICE_ACCOUNT not set');

        const serviceAccount = JSON.parse(serviceAccountStr);
        const PROJECT_ID = serviceAccount.project_id;
        const LOCATION = "us-central1"; // Vertex recommended location

        // 1. Get Access Token
        const accessToken = await getAccessToken(serviceAccount);

        // 2. Call Vertex AI
        // Using Gemini 2.5 Flash as requested.
        const MODEL_ID = "gemini-2.5-flash";

        const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

        // clean base64
        const base64Data = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [
                        { text: "Extract all text from this image exactly as it appears. No markdown formatting, just the text." },
                        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.0,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vertex AI Error (${response.status}): ${errText}`);
        }

        const result = await response.json();

        // Parse Vertex Response
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return new Response(
            JSON.stringify({ success: true, text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
