// Game state
let gameState = {
    category: null,
    letter: null,
    answered: false,
    hintUsed: false
};

// Game data
const letters = ["A","B","D","F","G","H","K","L","W","V","T","S","R","P","O","N","M"];
const categories = [
    "Een kledingstuk", "Een jongensnaam", "Een meisjesnaam", 
    "Iets dat geluid maakt", "Iets zoets", "Iets zuurs", 
    "Iets rond", "Iets warm", "Iets koud", "Een dier",
    "Een land", "Een stad", "Een beroep", "Een fruit",
    "Een groente", "Een sport", "Een muziekinstrument",
    "Een vervoermiddel", "Een superheld", "Een kleur",
    "Een sprookjesfiguur", "Een emotie", "Een feestdag",
    "Een weersomstandigheid", "Een schoolvak", "Een speelgoed",
    "Een gebouw", "Een meubel", "Een lichaamsdeel", 
    "Een zeedier", "Een insect", "Een bloem", "Een boom",
    "Een attractie", "Een game", "Een stripfiguur", 
    "Een film", "Een boek", "Een restaurant", "Een hobby"
];

// Load answers from localStorage
let answersDatabase = JSON.parse(localStorage.getItem('answersDatabase')) || initializeAnswersDatabase();

function initializeAnswersDatabase() {
    const db = { categories: {} };
    categories.forEach(category => {
        db.categories[category] = {};
        letters.forEach(letter => {
            db.categories[category][letter] = [];
        });
    });
    return db;
}

// Save answers to localStorage
function saveAnswersDatabase() {
    localStorage.setItem('answersDatabase', JSON.stringify(answersDatabase));
}

// Check if answer exists in database
function checkExistingAnswer(category, letter, answer) {
    try {
        const categoryAnswers = answersDatabase.categories[category][letter];
        return categoryAnswers.includes(answer.toLowerCase());
    } catch (e) {
        console.error('Error checking existing answer:', e);
        return false;
    }
}

// Save new answer to database
function saveAnswer(category, letter, answer) {
    try {
        if (!answersDatabase.categories[category][letter].includes(answer.toLowerCase())) {
            answersDatabase.categories[category][letter].push(answer.toLowerCase());
            saveAnswersDatabase();
        }
    } catch (e) {
        console.error('Error saving answer:', e);
    }
}

// API functions
async function checkAnswerWithAI(word, category, letter) {
    const apiKey = localStorage.getItem('openrouterApiKey');
    if (!apiKey) {
        showError('API key niet gevonden. Voer eerst je API key in.');
        return false;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:free",
                messages: [{
                    role: "user",
                    content: `Klopt het woord '${word}' met de gegeven letter en categorie? ${category} dat begint met de letter ${letter}. Het moet een nederlands woord zijn. Beantwoord met ja of nee`
                }]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.toLowerCase().trim().startsWith('ja');
    } catch (e) {
        console.error('Error checking answer:', e);
        showError('Er is een fout opgetreden bij het controleren van het antwoord.');
        return false;
    }
}

async function getHintFromAI() {
    const apiKey = localStorage.getItem('openrouterApiKey');
    if (!apiKey) {
        showError('API key niet gevonden. Voer eerst je API key in.');
        return null;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:free",
                messages: [{
                    role: "user",
                    content: `Geef een hint voor ${gameState.category} dat begint met de letter ${gameState.letter}. Maak het niet te makkelijk, geef geen direct antwoord.`
                }]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (e) {
        console.error('Error getting hint:', e);
        return 'Sorry, kon geen hint ophalen.';
    }
}

// UI functions
function showSuccess(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `✅ ${message}`;
    feedback.className = 'feedback success';
    feedback.style.display = 'block';
}

function showError(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = `❌ ${message}`;
    feedback.className = 'feedback error';
    feedback.style.display = 'block';
}

function updateQuestion() {
    document.getElementById('current-question').textContent = 
        `${gameState.category} dat begint met de letter ${gameState.letter}`;
}

// Game functions
function initializeGame() {
    gameState.category = categories[Math.floor(Math.random() * categories.length)];
    gameState.letter = letters[Math.floor(Math.random() * letters.length)];
    gameState.answered = false;
    gameState.hintUsed = false;
    
    updateQuestion();
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').style.display = 'none';
    document.getElementById('hint').style.display = 'none';
    document.getElementById('new-round-button').style.display = 'none';
    document.getElementById('hint-button').style.display = 'block';
}

function saveApiKey() {
    const apiKey = document.getElementById('api-key').value.trim();
    if (apiKey) {
        localStorage.setItem('openrouterApiKey', apiKey);
        document.getElementById('api-key-section').style.display = 'none';
        document.getElementById('game-section').style.display = 'block';
        initializeGame();
    } else {
        showError('Voer een geldige API key in');
    }
}

async function checkAnswer() {
    const answerInput = document.getElementById('answer-input');
    const answer = answerInput.value.trim();
    
    if (!answer) {
        showError('Voer eerst een antwoord in');
        return;
    }

    // First check in local database
    if (checkExistingAnswer(gameState.category, gameState.letter, answer)) {
        showSuccess('Goed zo!');
        gameState.answered = true;
        document.getElementById('new-round-button').style.display = 'block';
        document.getElementById('hint-button').style.display = 'none';
        return;
    }

    // If not in database, check with AI
    const isCorrect = await checkAnswerWithAI(answer, gameState.category, gameState.letter);
    if (isCorrect) {
        showSuccess('Goed zo!');
        saveAnswer(gameState.category, gameState.letter, answer);
        gameState.answered = true;
        document.getElementById('new-round-button').style.display = 'block';
        document.getElementById('hint-button').style.display = 'none';
    } else {
        showError('Helaas, dat is niet correct. Probeer het opnieuw.');
    }
}

async function getHint() {
    const hint = await getHintFromAI();
    const hintDiv = document.getElementById('hint');
    hintDiv.textContent = `💡 ${hint}`;
    hintDiv.style.display = 'block';
    gameState.hintUsed = true;
    document.getElementById('new-round-button').style.display = 'block';
}

function newRound() {
    initializeGame();
}

// Check if API key exists and initialize game
window.onload = function() {
    const apiKey = localStorage.getItem('openrouterApiKey');
    if (apiKey) {
        document.getElementById('api-key-section').style.display = 'none';
        document.getElementById('game-section').style.display = 'block';
        initializeGame();
    }
};