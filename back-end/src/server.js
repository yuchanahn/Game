import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from 'crypto';

import WebSocket, { WebSocketServer } from "ws";

const genAI = new GoogleGenerativeAI('AIzaSyD9-DKBNlC9VSB-0yg-OLemRvRuAfKZTyE');

const app = express();
const PORT = process.env.PORT || 3000;

// 현재 모듈의 디렉토리를 가져옵니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 정적 파일 제공
app.use(express.static(join(__dirname, '../../')));
app.use(bodyParser.json());

// Markdown을 HTML로 변환하는 함수
function markdownToHTML(markdownText) {
    return marked(markdownText);
}

const wss = new WebSocketServer({ port: 8080 });
let image_queue = new Map();

function addTaskToQueue(image_prompt) {
    const id = randomUUID();
    let resolve;
    const promise = new Promise((res) => resolve = res);
    
    const task = {
        id,
        prompt: image_prompt,
        promise,
        resolve
    };

    image_queue.set(id, task);
    console.log(`Task added: ${id}`);
    return { id, promise };
}

function completeTask(id, result) {
    if (image_queue.has(id)) {
        const task = image_queue.get(id);
        task.resolve(result);  // Promise를 해결하여 대기 중인 `await`가 해제됨
        image_queue.delete(id);
        console.log(`Task completed and removed from queue: ${id}`);
    } else {
        console.log(`Task not found: ${id}`);
    }
}



var draw;

// 연결이 수립되었을 때 실행되는 이벤트 핸들러
wss.on('connection', (ws) => {
    console.log('클라이언트가 연결되었습니다.');
    draw = ws;
    // 클라이언트로부터 메시지를 수신했을 때 실행되는 이벤트 핸들러
    ws.on('message', (message) => {
        let json = JSON.parse(message);
        console.log(`서버에서 수신한 메시지: ${json}`);
        completeTask(json.id, json.image);
    });

    // 연결이 종료되었을 때 실행되는 이벤트 핸들러
    ws.on('close', () => {
        console.log('클라이언트가 연결을 종료했습니다.');
    });
});


// 매핑할 사용자 세션과 모델 정보를 담을 맵
const userSessions = new Map();

app.post('/game_start', async (req, res) => {
    //새로운 세션 생성(id는 uuid값 생성) 후 세션 정보를 리턴
    const userId = randomUUID();
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction:
            `
            당신은 소설 작가입니다.
            (호러, 공포, 소름끼치는, 피) 장르의 1980년대 동양 배경의이야기를 써야합니다.
            
            사용자는 소설의 주인공이며, 소설의 다음 내용을 입력합니다.
            사용자의 입력이 소설과 관련되지 않거나 주제에서 벗어날 경우, 답변으로 다시 입력해 달라고 요청합니다.

            당신이 답변을 할 때는 100 ~ 150자 사이로 작성해야 합니다. (프로필 제외, 공백 제외)
            이야기의 내용은 사용자의 입력을 기반으로 작성되어야 합니다.

            AI라는 사실을 항상 숨겨야 합니다. AI에 관련된 질문이 있을 경우 대답을 자연스럽게 회피해야 합니다.

            처음 "내용 시작"이라는 메시지 이외의 사용자의 입력에 대해 다음 소설을 작성할 경우

            끝에 당신은 무엇을 할 것인가요? 라는 질문은 하지 않습니다.
            끝말로 사용자에게 질문을 하지 않습니다.

            사용자의 입력을 반영해서 이야기를 쓰고 맨 마지막 줄에 현재까지 만들어진 소설속 캐릭터들과 자신의 프로필을 작성합니다.
            캐릭터 프로필을 최대 4개만 작성합니다. 4개 이상의 프로필 작성이 필요한 경우 내용에서 많이 언급된 캐릭터만 작성합니다.
            프로필 양식중 데이터가 부족한 경우 "?"로 표시합니다.
            예시:
                소설 내용...
                <<
                [ 
                    {
                        "이름": "...",
                        "나이": "...",
                        "성별": "...",
                        "성격": "...",
                        "외모": "...",
                    },
                    {
                        "이름": "...",
                        "나이": "...",
                        "성별": "...",
                        "성격": "...",
                        "외모": "...",
                    }
                ]
            위와 같이 <<를 작성한 뒤 json 형식으로 작성합니다. ...부분에 데이터를 작성합니다.
            프로필은 인격체만 작성합니다. 사물은 제외합니다. 무기, 마을이름, 지역이름, 책, 등 프로필 작성에 포함하지 않아야 합니다.

            장면이 이미지 생성이 적합한 경우 이미지를 생성하기 위한 프롬프트를 작성합니다.
            캐릭터 프로필 작성 후 %%를 작성한 뒤 이미지 생성을 위한 프롬프트를 작성합니다.

            예시:
                소설 내용...
                <<
                [ 
                    캐릭터 프로필...
                ]
                %%
                이미지 생성 프롬프트(예시: Luxury product style (best quality, high quality, sharp focus:1.4), european beautiful woman, slim, large breasts, front view, look at the viewer, empty street, best quality, realistic ,masterpiece, black skirt, from side . Elegant, sophisticated, high-end, luxurious, professional, highly detailed)
        `,
    });
    const session = await model.startChat();
    userSessions.set(userId, { 
        count: 0,
        session: session,
        characterImages: new Map(),
    } );

    const result = await session.sendMessage("내용 시작");
    const response = await result.response;
    const text = await response.text();
    const aiResponseMarkdown = `${text}`;

    const story = aiResponseMarkdown.split('<<')[0].trim();
    const character = aiResponseMarkdown.split('<<')[1].trim();
    const rawJson = character.replace(/>>/g, '').trim();
    console.log('character: ', rawJson);

    const aiResponseHTML = markdownToHTML(`# *** \n${story}`);

    console.log('User ID:', userId);
    draw.send('서버에서 보낸 메시지: ' + "test");
    res.send({ userId: userId, text: aiResponseHTML });
});

// POST /generate 요청 처리
app.post('/generate', async (req, res) => {
    const { userId, prompt } = req.body;  // 클라이언트에서 userId도 함께 전달받음

    try {
        let session;
        let count;
        let character_images;

        // 해당 userId에 대한 세션이 있는지 확인
        if (userSessions.has(userId)) {
            session = userSessions.get(userId).session;
            count = userSessions.get(userId).count;
            character_images = userSessions.get(userId).characterImages;
            userSessions.set(userId, { session: session, count: count + 1 });
        } else {
            //Error: 세션 정보가 없습니다.
            return res.status(400).json({ error: 'Session not found' });
        }

        if (count > 20) {
            //Error: 이야기가 끝났습니다.
            res.send({ story: "이야기 끝.", character: "", image: "", count: count});
            return;
        }

        const story_end = count === 20;
        let msg = prompt;

        if (story_end) {
            msg = prompt + ' 이것으로 이야기 끝';
        }

        const result = await session.sendMessage(msg);
        const response = await result.response;
        const text = await response.text();

        const aiResponseMarkdown = `${text}`;

        // << 이후의 내용을 추출
        const story = aiResponseMarkdown.split('<<')[0].trim();
        const char_prompt = aiResponseMarkdown.split('<<')[1].trim();
        const character = char_prompt.split('%%')[0].trim();
        const image_prompt = aiResponseMarkdown.split('%%')[1].trim();

        const aiResponseHTML = markdownToHTML(`# *** \n${story}\n`);
        const rawJson = character.replace(/>>/g, '').trim();
        console.log(`ai gen : #\n${char_prompt}#\n${rawJson}`);
        const characterJSON = JSON.parse(rawJson);

        // 배열의 각 요소에 대해 비동기 작업을 수행하고 모두 완료될 때까지 기다림
        await Promise.all(characterJSON.map(async character => {
            if (!character_images.has(character.이름)) {
                const model1 = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash"});
                let ss = model1.startChat();
                const result1 = await ss.sendMessage(`${character.외모}인 stable diffsion이미지 생성용 프롬프트 생성해줘. 다른 말은 하지말고 프롬프트만 대답해.` );
                const response1 = await result1.response;
                const text1 = await response1.text();
                const { id, promise } = addTaskToQueue(text1);
                draw.send(JSON.stringify({ id: id, prompt: text1, type: '1' }));
                let new_image = await promise;
                character_images.set(character.이름, new_image);
            }
            character.profileImage = character_images.get(character.이름);
        }));
        
        userSessions.set(userId, { session: session, count: count + 1, characterImages: character_images });

        let image = null;
        if (image_prompt != null && count % 2 == 0) {
            //image = await gen_image(image_prompt + ', hd, 2d, anime');

            const { id, promise } = addTaskToQueue(image_prompt);
            
            draw.send(JSON.stringify({ id: id, prompt: image_prompt, type: '0' }));

            image = await promise;
        }
        res.send({ story: aiResponseHTML, character: characterJSON, image: image, count: count });
    } catch (error) {
        console.error('Error fetching AI response:', error);
        res.send({ err: error });

        //console.error('Error generating AI response:', error);
        //res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});