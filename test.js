//931357560796-rhhn7nsd03t1quu6fe4e7diiso7hjdfg.apps.googleusercontent.com
//google key = AIzaSyBCT3a4qCAOI5Cp_F3m_qsAdob7jNl11ok

import { marked } from 'marked'
import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI('AIzaSyBCT3a4qCAOI5Cp_F3m_qsAdob7jNl11ok');

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

async function run() {
    
    const prompt = "안녕 AI야 반가워~"
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
}

//run();

console.log(marked('## Title\n**strong**'));