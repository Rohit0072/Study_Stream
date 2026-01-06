import { GoogleGenerativeAI } from "@google/generative-ai";

export class ImageGenService {
    private genAI: GoogleGenerativeAI;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateImage(prompt: string, modelType: 'flux' | 'gemini'): Promise<string> {
        if (modelType === 'flux') {
            return this.generateFluxWithClient(prompt);
        } else {
            return this.generateGeminiImage(prompt);
        }
    }

    private async generateFluxWithClient(prompt: string): Promise<string> {
        console.log("Generating Flux image for:", prompt);
        try {
            // Dynamic import for client-side usage if needed, or standard import
            const { client } = await import("@gradio/client");

            // Connect to the generic Flux space
            const app = await client("black-forest-labs/FLUX.1-schnell");

            // The API definition for FLUX.1-schnell
            const result = await app.predict("/infer", [
                prompt, // prompt
                0,      // seed
                true,   // randomize_seed
                1024,   // width
                1024,   // height
                4       // num_inference_steps
            ]);

            console.log("Flux Result:", result);

            if (result?.data && Array.isArray(result.data)) {
                const img = result.data[0];
                // Gradio client often returns an object { url: "...", ... } or just a URL string depending on version
                if (typeof img === 'string') return img;
                if (img && typeof img === 'object' && 'url' in img) return (img as any).url;
            }

            throw new Error("Unexpected Flux response format");
        } catch (error) {
            console.error("Flux Generation Error:", error);
            throw error;
        }
    }

    private async generateGeminiImage(prompt: string): Promise<string> {
        console.log("Generating Gemini image for:", prompt);
        try {
            // Using the user-specified model: gemini-2.5-flash-image
            // Note: If this model is not yet available in the public SDK, this call might fail.
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

            // For Image Generation, the input is the prompt, output is image data.
            // Only 'Imagen' models strictly support this in Google Cloud, but 'Gemini' models usually do text/multimodal -> text.
            // However, assuming the user is correct and this model supports it via standard generateContent:
            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Note: JS SDK doesn't always automatically handle binary image responses gracefully in `text()`.
            // We might need to inspect the candidates or raw response.
            // As a fallback/placeholder, if we can't extract an image, we'll throw.
            // But let's check if there are inline data parts.
            // Since we can't test this without a real key/environment, we assume a standard pattern.

            // HYPOTHESIS: The model returns a text description OR a base64 image in parts.
            // If this is actually Imagen-3 under the hood:
            // It might require a REST call to a specific endpoint, not `generateContent`.
            // BUT, we will try the SDK first.

            const candidates = response.candidates;
            if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
                // Look for inline_data
                const imagePart = candidates[0].content.parts.find(p => p.inlineData);
                if (imagePart && imagePart.inlineData) {
                    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                }
            }

            // If we get text instead (refusal or description)
            const text = response.text();
            throw new Error(`Gemini returned text instead of image: ${text.substring(0, 100)}...`);

        } catch (error: any) {
            console.error("Gemini Generation Error:", error);
            const msg = error.message || "";
            if (msg.includes("400") && (msg.includes("billing") || msg.includes("billed"))) {
                throw new Error("Billing Required: This Google Cloud model requires an active billing account. Please switch to Flux.");
            }
            throw error;
        }
    }
}
