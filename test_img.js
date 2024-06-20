import Replicate from 'replicate';
const replicate = new Replicate(
    {
        auth: "r8_B3atCuxvhKSbk1uQYqlpXIN2hbKkhiW1eZHFg",
    }
);

const input = {
    prompt: "an astronaut riding a horse on mars, hd, dramatic lighting",
    scheduler: "K_EULER"
};
(async () => {
const output = await replicate.run("stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4", { input });
console.log(output)})();