import fetch from 'node-fetch';
import fs from 'fs';
import WebSocket from 'ws';

const mapTxt2ImgOptions = (options) => {
    let body = {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        seed: options.seed,
        subseed: options.variationSeed,
        subseed_strength: options.variationSeedStrength,
        sampler_name: options.samplingMethod,
        batch_size: options.batchSize,
        n_iter: options.batchCount,
        steps: options.steps,
        width: options.width,
        height: options.height,
        cfg_scale: options.cfgScale,
        seed_resize_from_w: options.resizeSeedFromWidth,
        seed_resize_from_h: options.resizeSeedFromHeight,
        restore_faces: options.restoreFaces,
    };
    if (options.hires) {
        body = {
            ...body,
            enable_hr: true,
            denoising_strength: options.hires.denoisingStrength,
            hr_upscaler: options.hires.upscaler,
            hr_scale: options.hires.upscaleBy,
            hr_resize_x: options.hires.resizeWidthTo,
            hr_resize_y: options.hires.resizeHeigthTo,
            hr_second_pass_steps: options.hires.steps,
        };
    }
    if (options.script) {
        body = {
            ...body,
            script_name: options.script.name,
            script_args: options.script.args || [],
        };
    }
    const { extensions } = options;
    if (extensions?.controlNet) {
        body.controlnet_units = extensions.controlNet.map(mapControlNetOptions);
    }
    return body;
};

const url = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
const data = {
    prompt: 'best quality, ultra high res, (photorealistic:1.4), (detailed beautiful girl:1.4), (medium breasts:0.8), Detailed facial details, beautiful detailed eyes, teenage, slender, smile, (makeup:0.4), red lips, (full body, sitting, castle, on couch), <lora:cuteGirlMix4_v10:0.7>, <lora:breastinclassBetter:0.3>,(Night:1.2), highly detailed clothes, (ulzzang-6500-v1.1:0.3), Style-Japan',
};

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapTxt2ImgOptions(data)),
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);

        const base64ImageDataUrl = `data:image/png;base64,${data.images[0]}`;
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Base64 Image</title>
            </head>
            <body>
                <h1>Base64 Image Example</h1>
                <img src="${base64ImageDataUrl}" alt="Base64 Image">
            </body>
            </html>
        `;
        fs.writeFile('example.html', html, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }

            console.log('File has been updated.');
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });

const ws = new WebSocket('ws://35.216.97.222:8080');

ws.on('open', function open() {
  console.log('Connected to server');
  ws.send('Hello server!');
});

ws.on('message', function incoming(message) {
  console.log('Received from server: %s', message);
});

ws.on('close', function close() {
  console.log('Disconnected from server');
});