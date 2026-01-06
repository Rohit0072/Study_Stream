import { Client } from "@gradio/client";

type ImageProvider = 'huggingface' | 'deepai' | 'magicstudio' | 'raphael' | 'pollinations' | 'puter' | 'custom-flux' | 'gemini';

/**
 * Generates an image using the selected provider.
 */
// Update types if needed
export async function generateImage(prompt: string, provider: ImageProvider = 'huggingface', apiKeys?: { hf?: string | null, gemini?: string | null }): Promise<string> {
    switch (provider) {
        case 'magicstudio':
            return await generateWithMagicStudio(prompt);
        case 'pollinations':
            return await generateWithPollinations(prompt);
        case 'puter':
            return await generateWithPuter(prompt);
        case 'gemini':
            return await generateWithGemini(prompt, apiKeys?.gemini);
        case 'huggingface':
            return generateWithHuggingFace(prompt, apiKeys?.hf);
        default:
            throw new Error('Invalid image generation provider');
    }
}

// ... existing functions ...

async function generateWithCustomFlux(prompt: string, token?: string | null, uuid?: string | null): Promise<string> {
    if (!token || !uuid) {
        throw new Error("ZeroGPU Token and UUID are required for Custom Flux. Please set them in Settings.");
    }

    console.log("[ImageGen] Connecting to Custom Flux Space...");

    try {
        // We use the specific space the user mentioned
        const client = await Client.connect("black-forest-labs/FLUX.1-schnell", {
            headers: {
                "x-zerogpu-token": token,
                "x-zerogpu-uuid": uuid
            }
        });

        console.log(`[ImageGen] Generating image (Custom Flux)...`);
        const result = await client.predict("/infer", {
            prompt: prompt,
            seed: Math.floor(Math.random() * 100000),
            randomize_seed: true,
            width: 1024,
            height: 1024,
            num_inference_steps: 4,
        });

        // @ts-ignore
        if (result?.data?.[0]?.url) {
            // @ts-ignore
            return result.data[0].url;
        } else {
            console.error("[ImageGen] Custom Flux Unexpected response:", result);
            throw new Error("No image URL found in response");
        }
    } catch (error: any) {
        console.error("Custom Flux Error:", JSON.stringify(error, null, 2));

        const errorString = JSON.stringify(error);
        if (errorString.includes("ZeroGPU quota exceeded")) {
            throw new Error("ZeroGPU Limit Reached: Your Hugging Face account has no GPU time left. Please switch to 'Pollinations' in Settings.");
        }

        throw new Error(`Custom Flux Failed: ${error.message || "Unknown error (check console)"}`);
    }
}

async function generateWithPuter(prompt: string): Promise<string> {
    if (typeof window === 'undefined' || !(window as any).puter) {
        throw new Error("Puter.js not loaded. Please refresh the page.");
    }

    try {
        console.log("[ImageGen] Generating with Puter...");

        // Puter struggles with complex prompts. We simplify it.
        // Format from CourseImageGenerator: "Minimal abstract course card illustration for a {Subject} course..."
        let simplePrompt = prompt;
        const subjectMatch = prompt.match(/illustration for a (.*?) course/i);
        if (subjectMatch && subjectMatch[1]) {
            simplePrompt = `Minimal illustration of ${subjectMatch[1]}`;
        } else {
            // Fallback: take first 10 words
            simplePrompt = prompt.split(' ').slice(0, 10).join(' ');
        }

        console.log(`[ImageGen] Simplified prompt for Puter: "${simplePrompt}"`);

        // @ts-ignore
        const imageElement = await (window as any).puter.ai.txt2img(simplePrompt);

        if (imageElement && imageElement.src) {
            const src = imageElement.src;

            // Should be a blob: URL usually. We need to convert to base64 for persistence
            if (src.startsWith('blob:')) {
                console.log("[ImageGen] Converting Puter Blob URL to Base64...");
                const response = await fetch(src);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }

            return src;
        } else {
            throw new Error("Puter did not return a valid image source.");
        }
    } catch (error) {
        console.error("Puter Generation Error:", error);
        throw error;
    }
}

async function generateWithPollinations(prompt: string): Promise<string> {
    const seed = Math.floor(Math.random() * 1000000);
    // Pollinations URL pattern: https://image.pollinations.ai/prompt/{prompt}?{params}
    // 'flux' is working better now.
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    // We fetch it to ensure it generates, then treat the URL as the result
    /* 
       Pollinations returns the image binary directly. 
       However, the <img> tag can load it directly from the URL.
       But for consistency with other providers that return a base64 or ephemeral blob-like URL, 
       we can just return this URL and let the browser cache handle it.
       
       Wait, if we return the URL, every re-render might fetch it again if the seed changes...
       But here the seed is baked into the URL string. So it's a stable static asset URL.
       Perfect.
    */

    // Optional: Ping it to make sure it's valid before returning? 
    // Usually Pollinations is fast. Let's just return the URL to make it instant for the UI.
    return url;
}

async function generateWithRaphael(prompt: string): Promise<string> {
    // Attempt to bypass limit with random UUID
    const randomUuid = crypto.randomUUID();

    const payload = {
        aspect: "1:1",
        autoTranslate: true,
        client_request_id: randomUuid,
        fastMode: false,
        highQuality: false,
        isSafeContent: true,
        model_id: "raphael-basic",
        prompt: prompt,
        turnstileToken: null
    };

    try {
        console.log("[ImageGen] Generating with Raphael...");

        if (typeof window !== 'undefined' && (window as any).electron) {
            const response = await (window as any).electron.proxyRequest("https://raphael.app/api/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://raphael.app",
                    "Referer": "https://raphael.app/"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Raphael API Error (Proxy): ${response.status} ${response.statusText} ${response.error || ''}`);
            }

            // data is Buffer { type: 'Buffer', data: [...] } or Uint8Array
            // But verify response structure. Raphael returns JSON.
            // The proxy returns 'data' as Buffer. need to parse it as JSON.

            const jsonString = new TextDecoder().decode(response.data);
            const data = JSON.parse(jsonString);

            if (data.images && data.images.length > 0) {
                return data.images[0].url;
            } else {
                throw new Error("No image returned from Raphael");
            }

        } else {
            // Fallback Direct
            const response = await fetch("https://raphael.app/api/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://raphael.app",
                    "Referer": "https://raphael.app/"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Raphael API Error: ${response.status} ${errText.slice(0, 100)}`);
            }
            const data = await response.json();

            if (data.images && data.images.length > 0) {
                return data.images[0].url;
            } else {
                throw new Error("No image returned from Raphael");
            }
        }

    } catch (error) {
        console.error("Raphael Generation Error:", error);
        throw error;
    }
}

async function generateWithMagicStudio(prompt: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('prompt', prompt);
    params.append('output_format', 'bytes');
    params.append('user_profile_id', 'null');
    params.append('anonymous_user_id', '9a5f6dc6-ad16-4df7-bc5b-a786b9dceb6a');
    params.append('request_timestamp', (Date.now() / 1000).toString());
    params.append('user_is_subscribed', 'false');
    params.append('client_id', 'pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o');

    try {
        console.log("[ImageGen] Generating with MagicStudio...");

        // Use Electron Proxy if available (fixes 403 CORS/Header issues in build)
        if (typeof window !== 'undefined' && (window as any).electron) {
            const response = await (window as any).electron.proxyRequest("https://ai-api.magicstudio.com/api/ai-art-generator", {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://magicstudio.com",
                    "Referer": "https://magicstudio.com/",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new Error(`MagicStudio API Error (Proxy): ${response.status} ${response.statusText} ${response.error || ''}`);
            }

            // response.data is Buffer (Uint8Array in renderer)
            const blob = new Blob([response.data], { type: 'image/png' });
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

        } else {
            // Fallback for Web/Dev (Direct fetch might fail CORS if not proxied, but local API route handles web dev)
            // Wait, we removed local API route usage.
            // If we are in web (non-electron), we might need the direct fetch or it will fail.
            // Assuming this fix is primarily for .exe.

            const response = await fetch("https://ai-api.magicstudio.com/api/ai-art-generator", {
                method: "POST",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Origin": "https://magicstudio.com",
                    "Referer": "https://magicstudio.com/"
                },
                body: params
            });

            if (!response.ok) {
                throw new Error(`MagicStudio API Error: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

    } catch (error) {
        console.error("MagicStudio Generation Error:", error);
        throw error;
    }
}

async function generateWithDeepAI(prompt: string, apiKey?: string | null): Promise<string> {
    if (!apiKey) {
        throw new Error("DeepAI API Key is required. Please set it in Settings.");
    }

    console.log("[ImageGen] Using DeepAI Provider...");
    const formData = new FormData();
    formData.append('text', prompt);
    formData.append('width', '1024'); // DeepAI HD square usually
    formData.append('height', '1024');

    // DeepAI HD params (from user request)
    formData.append('image_generator_version', 'hd');
    formData.append('use_new_model', 'false');
    formData.append('use_old_model', 'false');
    formData.append('quality', 'true');

    try {
        const response = await fetch("https://api.deepai.org/api/text2img", {
            method: "POST",
            headers: {
                "api-key": apiKey
            },
            body: formData
        });

        const data = await response.json();

        if (data.output_url) {
            console.log("[ImageGen] DeepAI Success:", data.output_url);
            return data.output_url;
        } else {
            console.error("[ImageGen] DeepAI Error:", data);
            throw new Error(`DeepAI Error: ${JSON.stringify(data.err || data)}`);
        }
    } catch (error) {
        console.error("[ImageGen] DeepAI Request Failed:", error);
        throw error;
    }
}

async function generateWithHuggingFace(prompt: string, token?: string | null): Promise<string> {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            console.log(`[ImageGen] Connecting to Gradio space(Attempt ${attempt + 1})...`);

            // Connect to the space, using token if available
            const options: any = {};
            if (token) {
                options.hf_token = token;
                console.log("[ImageGen] Using provided Hugging Face Token for authentication.");
            }

            const client = await Client.connect("black-forest-labs/FLUX.1-schnell", options);

            console.log(`[ImageGen] Generating image for prompt: "${prompt}"...`);
            const result = await client.predict("/infer", {
                prompt: prompt,
                seed: Math.floor(Math.random() * 100000), // Randomize seed manually just in case
                randomize_seed: true,
                width: 1024,
                height: 1024,
                num_inference_steps: 4,
            });

            // Validating response structure
            // @ts-ignore - The client types might not perfectly match the dynamic response
            if (result?.data?.[0]?.url) {
                // @ts-ignore
                const url = result.data[0].url;
                console.log("[ImageGen] Success! URL:", url);
                return url;
            } else {
                console.error("[ImageGen] Unexpected response structure:", result);
                throw new Error("No image URL found in response");
            }
        } catch (error: any) {
            console.warn(`[ImageGen] Attempt ${attempt + 1} failed: `, error?.message || error);

            // Check if we should retry (e.g., rate limits, queue full)
            attempt++;
            if (attempt >= MAX_RETRIES) {
                console.error("[ImageGen] Max retries reached. Failing.");
                throw error;
            }

            // Exponential backoff: 2s, 4s, 8s...
            const delay = 2000 * Math.pow(2, attempt - 1);
            console.log(`[ImageGen] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error("Image generation failed after multiple attempts. Try switching to DeepAI in Settings.");
}

async function generateWithGemini(prompt: string, apiKey?: string | null): Promise<string> {
    if (!apiKey) {
        throw new Error("Gemini API Key is required for Gemini Image Generation.");
    }

    const generate = async (modelName: string) => {
        console.log(`[ImageGen] Trying Gemini model: ${modelName}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    personGeneration: "allow_adult"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 400 && errText.includes("billed users")) {
                throw new Error("Billing Required: This model (Gemini/Imagen) requires a billed Google Cloud project. Please enable billing or use Flux.");
            }
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        return await response.json();
    };

    // 1. Try the default/best model first
    try {
        const data = await generate("imagen-3.0-generate-002");
        return processGeminiResponse(data);
    } catch (error: any) {
        // If it's a 404 (Model not found), let's discover what IS available
        if (error.message.includes("404") || error.message.includes("NOT_FOUND")) {
            console.warn("[ImageGen] Default model not found. Discovering available models...");

            try {
                // List models
                const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!listRes.ok) throw new Error("Failed to list models");

                const listData = await listRes.json();

                // Find any model that looks like 'imagen' or supports 'predict'
                const candidate = listData.models?.find((m: any) =>
                    (m.name.includes("imagen") || m.name.includes("image-generation")) &&
                    m.supportedGenerationMethods?.includes("predict")
                );

                if (candidate) {
                    // candidate.name is usually "models/imagen-..."
                    const modelName = candidate.name.replace("models/", ""); // strip prefix if present
                    console.log(`[ImageGen] Discovered fallback model: ${modelName}`);

                    const retryData = await generate(modelName);
                    return processGeminiResponse(retryData);
                } else {
                    const availableNames = listData.models?.map((m: any) => m.name).join(", ");
                    throw new Error(`No compatible Image Generation models found. Available: ${availableNames}`);
                }

            } catch (discoveryError: any) {
                console.error("Model discovery failed:", discoveryError);
                // If discovery fails, throw the original error or the discovery error
                throw new Error(`Gemini Error: Default model 404'd and discovery failed. ${discoveryError.message}`);
            }
        }

        throw new Error(`Gemini Generation Failed: ${error.message}`);
    }
}

function processGeminiResponse(data: any): string {
    if (data.predictions && data.predictions[0]) {
        if (data.predictions[0].bytesBase64Encoded) {
            return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        }
        if (data.predictions[0].b64) {
            return `data:image/png;base64,${data.predictions[0].b64}`;
        }
    }
    throw new Error("No image data found in Gemini response.");
}
