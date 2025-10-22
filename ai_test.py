import random
import os
from openai import OpenAI
import streamlit as st

def get_api_key():
    """Get API key from various sources in order of preference"""
    # 1. Try to get from Streamlit secrets
    try:
        return st.secrets["OPENROUTER_API_KEY"]
    except (KeyError, FileNotFoundError):
        pass
    
    # 2. Try to get from environment variables
    key = os.getenv("OPENROUTER_API_KEY")
    if key:
        return key
    
    # 3. Try to get from session state if user has input it before
    if "api_key" in st.session_state and st.session_state.api_key:
        return st.session_state.api_key
    
    return None

def check_answer(client, word, category, letter):
    """Check if an answer is valid using the AI"""
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b:free",
            messages=[{
                "role": "user",
                "content": f"Klopt het woord '{word}' met de gegeven letter en categorie? {category} dat begint met de letter {letter}. Beantwoord met ja of nee"
            }]
        )
        return completion.choices[0].message.content.lower().strip().startswith("ja")
    except Exception as e:
        st.error(f"Error checking answer: {e}")
        return False

def initialize_game():
    """Initialize or reset game state"""
    letters = ["A","B","D","F","G","H","K","L","W","V","T","S","R","P","O","N","M"]
    categories = ["Een kledingstuk", "Een jongensnaam", "Een meisjesnaam", 
                 "Iets dat geluid maakt", "Iets zoets", "iets zuurs", 
                 "Iets rond", "Iets warm", "Iets koud"]
    
    st.session_state.letter = random.choice(letters)
    st.session_state.category = random.choice(categories)
    st.session_state.question = f"{st.session_state.category} dat begint met de letter {st.session_state.letter}"
    st.session_state.answered = False
    st.session_state.feedback = ""

def main():
    # App title and description
    st.title("Woordspel")
    st.write("Bedenk een woord dat past bij de categorie en begint met de gegeven letter.")
    
    # API Key handling
    api_key = get_api_key()
    if not api_key:
        with st.expander("API Key Configuratie"):
            st.markdown("""
            ### API Key niet gevonden
            
            Je kunt je OpenRouter API key op drie manieren configureren:
            
            1. **Streamlit Secrets** (aanbevolen voor deployment):
               - Maak een `.streamlit/secrets.toml` bestand aan
               - Voeg toe: `OPENROUTER_API_KEY = "your-key-here"`
               
            2. **Environment Variable** (lokale ontwikkeling):
               - Maak een `.env` bestand aan met `OPENROUTER_API_KEY=your-key-here`
               - Of voeg deze toe aan je omgevingsvariabelen
               
            3. **Handmatige invoer** (alleen voor tijdelijk gebruik):
            """)
            
        input_key = st.text_input("Voer je OpenRouter API key in:", type="password")
        if input_key:
            st.session_state.api_key = input_key
            api_key = input_key
            st.rerun()
    
    # Initialize client if API key is available
    if api_key:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        
        # Initialize game state if needed
        if "letter" not in st.session_state:
            initialize_game()
        
        # Display current question
        st.subheader("Vraag:")
        st.write(st.session_state.question)
        
        # Answer input
        user_answer = st.text_input("Jouw antwoord:", key="answer_input")
        
        # Check button
        if st.button("Controleer Antwoord") and user_answer:
            is_correct = check_answer(client, user_answer, st.session_state.category, st.session_state.letter)
            if is_correct:
                st.session_state.feedback = "✅ Goed zo!"
                st.session_state.answered = True
            else:
                st.session_state.feedback = "❌ Helaas, dat is niet correct. Probeer het opnieuw."
        
        # Display feedback
        if st.session_state.feedback:
            st.write(st.session_state.feedback)
        
        # New round button
        if st.session_state.answered and st.button("Nieuwe Ronde"):
            initialize_game()
            st.rerun()
    
if __name__ == "__main__":
    main()