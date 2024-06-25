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

async function fetchImage(prompt, is_character) {
    try {
        console.log(`Fetching image... prompt : ${prompt}`);
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mapTxt2ImgOptions({ 
                prompt: is_character ? prompt : prompt + 'only face, portrait, headshot, head shot, head only, face only',
                negativePrompt: 'worst quality, low quality,  bad anatomy, bad hands, bad body, missing fingers, extra digit, fewer digits',
                steps: 30,
                width: is_character ? 100 : 512,
                height: is_character ? 100 : 512,
            })), // using prompt directly, assuming no mapTxt2ImgOptions function
        });
        if (!res.ok) {
            // 요청이 성공하지 않은 경우 에러를 발생시킵니다.
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        let json = await res.json();
        return json.images[0];
    } catch (error) {
        // 에러가 발생하면 콘솔에 에러 메시지를 출력하고 null을 반환합니다.
        console.error('Error fetching image:', error);
        return null;
    }
}

const ws = new WebSocket('ws://35.216.97.222:8080');

ws.on('open', function open() {
    console.log('Connected to server');
    let json = JSON.stringify({ type: 'message', data: 'Hello server!' });
    ws.send(json);
});

ws.on('message', async function incoming(message) {
    try {
        const json = JSON.parse(message);
        if (json.prompt == null) {
            return;
        }
        
        let image;

        if (json.type !== null){
            image = await fetchImage(json.prompt);
        } else {
            image = await fetchImage(json.prompt);
        }
        
        ws.send(JSON.stringify({ id: json.id, image: `data:image/png;base64,${image}`}));
    } catch (e) {
        return;
    }
});

ws.on('close', function close() {
    console.log('Disconnected from server');
});
