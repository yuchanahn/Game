import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from 'crypto';

const genAI = new GoogleGenerativeAI('AIzaSyBCT3a4qCAOI5Cp_F3m_qsAdob7jNl11ok');

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
            매번 새로운 이야기를 시작하시면 됩니다.
            판타지, 로맨스 장르의 이야기를 써야합니다.

            사용자는 소설의 주인공이며, 소설의 다음 내용을 입력합니다.
            사용자의 입력이 소설과 관련되지 않거나 주제에서 벗어날 경우, 답변으로 다시 입력해 달라고 요청합니다.

            답변을 할 때는 300 ~ 500자 사이로 작성해야 합니다. (프로필 제외)
            이야기의 내용은 사용자의 입력을 기반으로 작성되어야 합니다.

            AI라는 사실을 항상 숨겨야 합니다. AI에 관련된 질문이 있을 경우 대답을 자연스럽게 회피해야 합니다.

            처음 "내용 시작"이라는 메시지 이외의 사용자의 입력에 대해 다음 소설을 작성할 경우

            당신은 "X" 라고 했습니다. 또는
            당신은 X 행동을 했습니다.
            당신은 X를 발견했습니다. 등의 문장으로 시작해야 합니다.

            끝에 당신은 무엇을 할 것인가요? 라는 질문은 하지 않습니다.
            끝말로 사용자에게 질문을 하지 않습니다.

            사용자의 입력을 반영해서 이야기를 쓰고 맨 마지막 줄에 현재까지 만들어진 소설속 캐릭터들과 자신의 프로필을 작성합니다.
            프로필은 인격체만 작성합니다. 그리고 내용상 많이 등장하는 캐릭터만 작성합니다. 더 이상 비중이 없어진 캐릭터는 더이상 프로필을 작성하지 않습니다.
            작성할 데이터가 부족할 경우에는 캐릭터 프로필을 작성하지 않습니다.
            프로필 양식중 데이터가 부족한 경우 ?로 표시합니다.

            프로필을 작성할 때는

            예시:
                소설 내용...
                <
                {{이름: ...},
                {나이: ...},
                {성별: ...},
                {성격: ...},
                {외모: ...},
                {배경: ...},
                {AI 생성 프롬프트: ...}},
                {{이름: ...},
                {나이: ...},
                {성별: ...},
                {성격: ...},
                {외모: ...},
                {배경: ...},
                {AI 생성 프롬프트: ...}}
                >
            위와 같이 <>내부에 json 형식으로 작성합니다. ...부분에 데이터를 작성합니다.
        `,
    });
    const session = await model.startChat();
    userSessions.set(userId, session);

    const result = await session.sendMessage("내용 시작");
    const response = await result.response;
    const text = await response.text();
    const aiResponseMarkdown = `${text}`;

    const character = [];
    const story = aiResponseMarkdown.replace(/<([^>]*)>/g, (match, p1) => {
        const characters = p1.split('},').map((character) => {
            const characterData = character.replace(/{|}/g, '').split(',').map((data) => {
                const [key, value] = data.split(':');
                return [key.trim(), value.trim()];
            });

            const characterInfo = Object.fromEntries(characterData);
            character.push(characterInfo);
        }
        );
    
    const aiResponseHTML = markdownToHTML(`# *** \n${story}`);

    console.log('User ID:', userId);

    res.send({ userId: userId, text: aiResponseHTML });
});

// POST /generate 요청 처리
app.post('/generate', async (req, res) => {
    const { userId, prompt } = req.body;  // 클라이언트에서 userId도 함께 전달받음
    
    try {
        let session;

        // 해당 userId에 대한 세션이 있는지 확인
        if (userSessions.has(userId)) {
            session = userSessions.get(userId);
        } else {
            //Error: 세션 정보가 없습니다.
            return res.status(400).json({ error: 'Session not found' });
        }

        const result = await session.sendMessage(prompt);
        const response = await result.response;
        const text = await response.text();

        const aiResponseMarkdown = `${text}`;
        
        // <>로 묶인 부분을 추출

        const character = [];
        const story = aiResponseMarkdown.replace(/<([^>]*)>/g, (match, p1) => {
            const characters = p1.split('},').map((character) => {
                const characterData = character.replace(/{|}/g, '').split(',').map((data) => {
                    const [key, value] = data.split(':');
                    return [key.trim(), value.trim()];
                });

                const characterInfo = Object.fromEntries(characterData);
                character.push(characterInfo);
            });

            return '';
        });

        const aiResponseHTML = markdownToHTML(`# *** \n${story}\n`);

        res.send({ story: aiResponseHTML, character: character });
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
