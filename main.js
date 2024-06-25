document.addEventListener('DOMContentLoaded', function () {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const startBtn = document.getElementById('start-btn');
    const dialogueBox = document.getElementById('dialogue-box');
    const dialogue = document.getElementById('dialogue');
    const characterList = document.getElementById('character-list'); // 캐릭터 리스트 요소
    const loadingSpinner = document.getElementById('loading-spinner-container'); // 로딩 스피너 추가
    const countBox = document.getElementById('count-box');

    var user_id = "";

    function toggleLoadingSpinner(show) {
        if (show) {
            loadingSpinner.style.display = 'flex';
            sendBtn.style.display = 'none';
            sendBtn.disabled = true; // 로딩 중에는 전송 버튼 비활성화
            userInput.disabled = true; // 로딩 중에는 사용자 입력 비활성화

            //로딩중 전송 버튼의 전송 텍스트 ""로
            sendBtn.innerHTML = "";
        } else {
            loadingSpinner.style.display = 'none';
            sendBtn.style.display = 'block';
            sendBtn.disabled = false; // 로딩 완료 후 전송 버튼 활성화
            userInput.disabled = false; // 로딩 완료 후 사용자 입력 활성화

            //로딩완료 후 전송 버튼의 전송 텍스트 "전송"으로
            sendBtn.innerHTML = "전송";
        }
    }
    
    const Option = "Lan";
    const IP_Lan = "http://127.0.0.1:3000";
    const IP_Wan = "http://35.216.97.222:3000";
    
    const IP = Option == "Wan" ? IP_Lan : IP_Wan;

    async function startGame() {
        try {
            toggleLoadingSpinner(true); // 로딩 스피너 표시
            //const response = await axios.post('http://127.0.0.1:3000/game_start', {
            const response = await axios.post(`${IP}/game_start`, {
                prams: "prams",
            });
            user_id = response.data.userId;
            
            console.log('User ID:', user_id);
            
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
        
            // 프로필 이미지 표시
            const profileImage = document.createElement('img');
            profileImage.src = character.profileImage;
            characterBox.appendChild(profileImage);
        
            // 세부사항 표시 (기본적으로 숨김)
            const details = document.createElement('div');
            details.classList.add('character-details', 'hidden');
            details.textContent = `이름: ${character.이름}, 나이: ${character.나이}, 성별 : ${character.성별}, 성격: ${character.성격}, 외모: ${character.외모}`;
            characterBox.appendChild(details);
            characterList.appendChild(characterBox);
        });
    }

    function showCount(count) {
        countBox.innerHTML = `진행도: ${count} / 20`;
    }

    async function getAIResponse(prompt) {
        try {
            toggleLoadingSpinner(true); // 로딩 스피너 표시

            const response = await axios.post(`${IP}/generate`, {
                prompt: prompt,
                userId: user_id,
            });
            toggleLoadingSpinner(false); // 로딩 스피너 숨김

            if(response.data.err != null) {
                init();
                return `Error : ${response.data.err}`;
            }

            let story = response.data.story;
            let characters = response.data.character;
            let image = response.data.image;
            
            if (image != null) {
                const imageBox = document.createElement('div');
                imageBox.classList.add('image-box');
                imageBox.innerHTML = `<img src="${image}" alt="Base64">`; // AI 이미지 표시
                dialogue.appendChild(imageBox);
            }
            showCount(response.data.count); // 진행도 표시
            displayCharacters(characters); // 캐릭터 정보 표시
            return story;
        } catch (error) {
            init();
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
        user_id = "";
        dialogue.innerHTML = ''; // dialogueBox 초기화
        startBtn.style.display = 'block'; // 시작 버튼 보이기
        dialogueBox.style.display = 'none'; // dialogueBox 숨기기
        sendBtn.disabled = true; // 전송 버튼 비활성화
        userInput.disabled = true; // 사용자 입력 비활성화
        startBtn.disabled = false; // 게임 시작 버튼 활성화

        characterList.innerHTML = ''; // 캐릭터 리스트 초기화
    }
    
    init();
});
