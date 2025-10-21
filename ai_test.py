import random
import os
from openai import OpenAI

def get_api_key():
    """Get API key from environment or prompt user"""
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        print("Warning: OPENROUTER_API_KEY not found in environment.")
        key = input("Enter your OpenRouter API key: ")
    return key

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
        print(f"Error checking answer: {e}")
        return False

def play_round(client):
    """Play a single round of the game"""
    letters = ["A","B","D","F","G","H","K","L","W","V","T","S","R","P","O","N","M"]
    categories = ["Een kledingstuk", "Een jongensnaam", "Een meisjesnaam", 
                 "Iets dat geluid maakt", "Iets zoets", "iets zuurs", 
                 "Iets rond", "Iets warm", "Iets koud"]
    
    letter = random.choice(letters)
    category = random.choice(categories)
    question = f"{category} dat begint met de letter {letter}"
    
    print("\nVraag:", question)
    
    # Keep trying until correct answer
    while True:
        answer = input("Jouw antwoord: ")
        if check_answer(client, answer, category, letter):
            print("Goed zo!")
            break
        else:
            print("Helaas, dat is niet correct. Probeer het opnieuw.")

def main():
    # Initialize client
    api_key = get_api_key()
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    
    # Game loop
    while True:
        play_round(client)
        
        # Ask to play again
        while True:
            again = input("Wil je nog een keer spelen? (j/n): ").lower().strip()
            if again.startswith("j"):
                break
            elif again.startswith("n"):
                print("Bedankt voor het spelen!")
                return
            else:
                print("Antwoord met 'j' of 'n'.")

if __name__ == "__main__":
    main()