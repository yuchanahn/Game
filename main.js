document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const generateBtn = document.getElementById('generate-btn');
    const dialogue = document.getElementById('dialogue');
    const characterDisplay = document.getElementById('character-display');

    async function getAIResponse(prompt) {
        try {
            const response = await axios.post('http://35.216.97.222:3000/generate', {
                prompt: prompt,
            });

            console.log(response.data);

            return response.data;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return 'Error fetching AI response';
        }
    }

    generateBtn.addEventListener('click', function () {
        characterDisplay.innerHTML = '<p>새로운 캐릭터가 생성되었습니다!</p>';
    });

    sendBtn.addEventListener('click', async function () {
        const userText = userInput.value;
        if (userText.trim() === '') return;

        const aiResponse = await getAIResponse(userText);
        dialogue.innerHTML += `사용자: ${userText}<br>${aiResponse}<br>`;
        
        userInput.value = '';
    });
});
