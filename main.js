document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const generateBtn = document.getElementById('generate-btn');
    const startBtn = document.getElementById('start-btn');
    const dialogueBox = document.getElementById('dialogue-box');
    const dialogue = document.getElementById('dialogue');
    const characterDisplay = document.getElementById('character-display');

    user_id = "";

    async function startGame() {
        try {
            const response = await axios.post('http://35.216.97.222:3000/game_start', {
                prams: "prams",
            });
            user_id = response.data.userId;
            return response.data.text;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return 'Error fetching AI response';
        }
    }

    async function getAIResponse(prompt) {
        try {
            const response = await axios.post('http://35.216.97.222:3000/generate', {
                prompt: prompt,
                userId: user_id,
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return 'Error fetching AI response';
        }
    }

    function appendMessage(user, message) {
        const messageBox = document.createElement('div');
        messageBox.classList.add('message', user ? 'user-message' : 'ai-message');
        messageBox.innerHTML = user ? `사용자: ${message}` : `${message}`;
        dialogue.appendChild(messageBox);
        dialogueBox.scrollTop = dialogueBox.scrollHeight;
    }

    generateBtn.addEventListener('click', function () {
        characterDisplay.innerHTML = '<p>새로운 캐릭터가 생성되었습니다!</p>';
    });

    sendBtn.addEventListener('click', async function () {
        const userText = userInput.value;
        if (userText.trim() === '') return;

        appendMessage(true, userText);

        const aiResponse = await getAIResponse(userText);
        appendMessage(false, aiResponse);
        
        userInput.value = '';
    });

    startBtn.addEventListener('click', async function () {
        const aiResponse = await startGame();
        appendMessage(false, aiResponse);
        startBtn.style.display = 'none';
    });

    userInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            sendBtn.click();
        }
    });
});
