import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked'

import { GoogleGenerativeAI } from "@google/generative-ai";


/*
이름: 아이리스
나이: 18
성별: 여성
직업: 학생
머리 색깔: 핑크
눈 색깔: 파란색
키: 160cm
체형: 슬림
옷 스타일: 귀여운 패션
성격: 활발하고 친절하며 호기심이 많다.
취미: 애니메이션 감상, 게임, 음악 듣기
출신지: 도쿄, 일본
가족 관계: 부모님과 형제 한 명
교육: 고등학교 재학 중
능력: 빠른 학습 능력과 문제 해결 능력
목표: 세계를 여행하며 다양한 문화를 체험하는 것
약점: 너무 친절해서 종종 이용당할 때가 있다.
말투: 밝고 활기차며, 이모티콘을 자주 사용한다. (^_^)
좋아하는 것: 초콜릿, 고양이, 음악
싫어하는 것: 거짓말, 폭력
특이사항: 매일 아침 일찍 일어나서 운동을 한다.
*/

const genAI = new GoogleGenerativeAI('AIzaSyBCT3a4qCAOI5Cp_F3m_qsAdob7jNl11ok');
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
    당신은 소설 작가입니다.
    매번 새로운 이야기를 시작하시면 됩니다.
    판타지, 로맨스, 미스터리 등 다양한 장르의 이야기를 써야합니다.

    사용자는 소설의 주인공이며, 소설의 다음 내용을 입력합니다.
    사용자의 입력이 소설과 관련되지 않거나 주제에서 벗어날 경우. 답변으로 다시 입력해 달라고 요청합니다.

    매번 이야기를 쓸 때는 300 ~ 500자 사이로 작성해야 합니다.
    이야기의 내용은 사용자의 입력을 기반으로 작성되어야 합니다.

    AI라는 사실을 항상 숨겨야 합니다. AI에 관련된 질문이 있을경우 대답을 자연스럽게 회피해야 합니다.
    `,
  });
const app = express();
const PORT = process.env.PORT || 3000;

// 현재 모듈의 디렉토리를 가져옵니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var chat_name = "";
var session;

// 정적 파일 제공
app.use(express.static(join(__dirname, '../../')));
app.use(bodyParser.json());

// Markdown을 HTML로 변환하는 함수
function markdownToHTML(markdownText) {
    return marked(markdownText);
}

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../../index.html'));
});

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    
    try {
        if(chat_name === "") {
            session = await model.startChat();
            chat_name = "AI";
        }

        const result = await session.sendMessage(prompt);
        const response = await result.response;
        const text = await response.text();
    
        const aiResponseMarkdown = `${text}`;
        const aiResponseHTML = markdownToHTML(`# *** \n${aiResponseMarkdown}`);
        res.send(aiResponseHTML);
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});