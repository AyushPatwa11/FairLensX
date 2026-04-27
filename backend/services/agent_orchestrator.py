<<<<<<< HEAD
=======
from langchain_core.messages import HumanMessage, SystemMessage
from .llm_helper import get_llm_wrapper
>>>>>>> c6dbba4322f81e2b4b3962a7c9222169d5e57982
import os
import re

<<<<<<< HEAD
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_core.messages import HumanMessage, SystemMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False

def _rule_based_nlp_chat(message: str) -> str:
    """Offline NLP Engine using regex pattern matching for intent recognition."""
    msg = message.lower()
    
    if re.search(r'\b(hello|hi|hey|greetings)\b', msg):
        return "Hello! I am your offline FairLens AI Assistant. How can I help you with bias detection today?"
        
    if re.search(r'\b(bias|fairness|discrimination|disparate)\b', msg):
        return "**Bias in AI** often stems from unrepresentative training data or historical prejudices. You can use our **Dataset Analyzer** to measure Demographic Parity and detect these hidden biases in your data."
        
    if re.search(r'\b(mitigate|fix|solve|reweighing|reduce)\b', msg):
        return "To mitigate bias, we support techniques like **Reweighing**, which assigns different mathematical weights to training examples based on their sensitive attributes to balance the final outcomes."
        
    if re.search(r'\b(job|jd|description|hiring|resume)\b', msg):
        return "Job descriptions can contain subtle bias. Words like 'aggressive', 'ninja', or 'rockstar' can subconsciously deter female candidates. Paste your JD in our **JD Scanner** to find and replace these exclusionary terms!"
        
    if re.search(r'\b(simulate|counterfactual|individual|profile)\b', msg):
        return "The **Profile Simulator** uses counterfactual fairness. It changes a single sensitive attribute (like Gender) while keeping all other qualifications identical to see if the model's hiring prediction changes."

    return "I'm currently running in **Offline NLP Mode** without an API key. I understand questions related to *bias, fairness, mitigation, datasets, counterfactuals, and job descriptions*. Could you try rephrasing your question using those terms?"

=======
>>>>>>> c6dbba4322f81e2b4b3962a7c9222169d5e57982
def chat_with_agent(message: str) -> str:
    """
    Takes a user message, tries to run it through LangChain, but seamlessly falls back to local NLP.
    """
<<<<<<< HEAD
    api_key = os.getenv("GOOGLE_API_KEY")
    
    # Check if we should use Offline NLP
    if not api_key or api_key == "your_gemini_api_key_here" or not LANGCHAIN_AVAILABLE:
        return _rule_based_nlp_chat(message)
        
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)
=======
    wrapper = get_llm_wrapper(temperature=0.2)
    if not wrapper:
        return "Please set your GOOGLE_API_KEY in the backend/.env file to chat with me!"

    try:
>>>>>>> c6dbba4322f81e2b4b3962a7c9222169d5e57982
        system_prompt = SystemMessage(content="You are FairLens AI Assistant, a helpful compliance officer. You help users understand AI bias, job description fairness, and dataset mitigation techniques. Keep your answers concise, practical, and formatted neatly.")
        human_msg = HumanMessage(content=message)
        response = wrapper.invoke([system_prompt, human_msg])
        return response.content
    except Exception as e:
        # If API fails for any reason (e.g. rate limit, bad key), gracefully fallback to NLP
        print(f"LLM API Error: {e}. Falling back to NLP rules.")
        return _rule_based_nlp_chat(message)

