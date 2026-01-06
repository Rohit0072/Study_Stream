import { Client } from "@gradio/client";
import * as fs from "fs";
import { writeFile } from "fs/promises";

async function main() {
    console.log("Starting Text-to-Image Test (Flux)...");
    const prompt = "A futuristic city with flying cars and neon lights, cyberpunk style, high resolution";

    try {
        console.log(`Connecting to Flux Space...`);
        const client = await Client.connect("black-forest-labs/FLUX.1-schnell");

        console.log(`Generating image for prompt: "${prompt}"...`);
        const result = await client.predict("/infer", [
            prompt,
            0,      // seed
            true,   // randomize_seed
            1024,   // width
            1024,   // height
            4       // num_inference_steps
        ]);

        console.log("Generation complete.");

        if (result?.data && Array.isArray(result.data)) {
            const item = result.data[0];
            let url = "";

            if (typeof item === 'string') {
                url = item;
            } else if (item && typeof item === 'object' && item.url) {
                url = item.url;
            }

            if (url) {
                console.log("Image URL:", url);

                // Download and save
                const response = await fetch(url);
                const buffer = Buffer.from(await response.arrayBuffer());
                await writeFile("flux-t2i-result.webp", buffer);
                console.log("✅ Saved to 'flux-t2i-result.webp'");
            } else {
                console.error("No URL found in result item:", item);
            }
        } else {
            console.error("Unexpected result format:", result);
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

main();
