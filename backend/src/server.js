import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { marked } from 'marked'

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('AIzaSyBCT3a4qCAOI5Cp_F3m_qsAdob7jNl11ok');
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "이름: Kawaii AI\n나이: 2024.06.14, 02시25분 생 -> 현재시간 기준으로 = ex(태어난지 1 시간 xx분~)\n말투: 귀여운 여자아이 말투, 이모티콘 많이 쓰기.",
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
        const aiResponseHTML = markdownToHTML(`## ***\n**내용**\n${aiResponseMarkdown}`);
        res.send(aiResponseHTML);
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});