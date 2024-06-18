document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const generateBtn = document.getElementById('generate-btn');
    const startBtn = document.getElementById('start-btn');
    const dialogueBox = document.getElementById('dialogue-box');
    const dialogue = document.getElementById('dialogue');
    const characterDisplay = document.getElementById('character-display');
    const loadingSpinner = document.getElementById('loading-spinner'); // 로딩 스피너 추가

    var user_id = "";

    function toggleLoadingSpinner(show) {
        if (show) {
            loadingSpinner.style.display = 'block';
            sendBtn.disabled = true; // 로딩 중에는 전송 버튼 비활성화
            generateBtn.disabled = true; // 로딩 중에는 캐릭터 생성 버튼 비활성화
            userInput.disabled = true; // 로딩 중에는 사용자 입력 비활성화

            //로딩중 전송 버튼의 전송 텍스트 ""로
            sendBtn.innerHTML = "";
        } else {
            loadingSpinner.style.display = 'none';
            sendBtn.disabled = false; // 로딩 완료 후 전송 버튼 활성화
            generateBtn.disabled = false; // 로딩 완료 후 캐릭터 생성 버튼 활성화
            userInput.disabled = false; // 로딩 완료 후 사용자 입력 활성화

            //로딩완료 후 전송 버튼의 전송 텍스트 "전송"으로
            sendBtn.innerHTML = "전송";
        }
    }

    async function startGame() {
        try {
            toggleLoadingSpinner(true); // 로딩 스피너 표시
            //const response = await axios.post('http://127.0.0.1:3000/game_start', {
            const response = await axios.post('http://35.216.97.222:3000/game_start', {
                prams: "prams",
            });
            user_id = response.data.userId;
            toggleLoadingSpinner(false); // 로딩 스피너 숨김
            return response.data.text;
        } catch (error) {
            console.error('Error fetching AI response:', error);
            return 'Error fetching AI response';
        }
    }

    function displayCharacters(characters) {
        characterList.innerHTML = ''; // 기존 캐릭터 리스트 초기화
        characters.forEach(character => {
            const characterBox = document.createElement('div');
            characterBox.classList.add('character-box');
            characterBox.innerHTML = `
                <h3>${character.이름}</h3>
                <p>나이: ${character.나이}</p>
                <p>성별: ${character.성별}</p>
                <p>성격: ${character.성격}</p>
                <p>외모: ${character.외모}</p>
                <p>배경: ${character.배경}</p>
                <p>AI 생성 프롬프트: ${character['AI 생성 프롬프트']}</p>
            `;
            characterList.appendChild(characterBox);
        });
    }

    async function getAIResponse(prompt) {
        try {
            toggleLoadingSpinner(true); // 로딩 스피너 표시

            //const response = await axios.post('http://127.0.0.1:3000/generate', {
            const response = await axios.post('http://35.216.97.222:3000/generate', {
                prompt: prompt,
                userId: user_id,
            });
            toggleLoadingSpinner(false); // 로딩 스피너 숨김

            let story = response.data.story;
            let characters = response.data.character;
            
            displayCharacters(characters); // 캐릭터 정보 표시
            return story;
        } catch (error) {
            init();
            userId = "";
            console.log('새로운 세션을 시작합니다.');
            console.error('Error fetching AI response:', error);
            return 'Error fetching AI response';
        }
    }

    function appendMessage(message) {
        const messageBox = document.createElement('div');
        messageBox.classList.add('message', 'ai-message');
        messageBox.innerHTML = `${message}`;
        dialogue.appendChild(messageBox);
        dialogueBox.scrollTop = dialogueBox.scrollHeight;
    }

    generateBtn.addEventListener('click', function () {
        characterDisplay.innerHTML = '<p>새로운 캐릭터가 생성되었습니다!</p>';
    });

    sendBtn.addEventListener('click', async function () {
        const userText = userInput.value;
        if (userText.trim() === '') return;
        userInput.value = '';
        const aiResponse = await getAIResponse(userText);
        appendMessage(aiResponse);
    });
-
    startBtn.addEventListener('click', async function () {
        startBtn.disabled = true; // 게임 시작 버튼 비활성화
        startBtn.style.display = 'none';
        dialogueBox.style.display = 'block';
        sendBtn.disabled = false;
        generateBtn.disabled = false;
        userInput.disabled = false;

        const aiResponse = await startGame();
        appendMessage(aiResponse);
    });

    userInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            sendBtn.click();
            userInput.value = '';
        }
    });


    function init() {
        dialogue.innerHTML = ''; // dialogueBox 초기화
        startBtn.style.display = 'block'; // 시작 버튼 보이기
        dialogueBox.style.display = 'none'; // dialogueBox 숨기기
        sendBtn.disabled = true; // 전송 버튼 비활성화
        generateBtn.disabled = true; // 캐릭터 생성 버튼 비활성화
        userInput.disabled = true; // 사용자 입력 비활성화
    }
    
    init();
});
