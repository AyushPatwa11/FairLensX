from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os

def get_llm():
    # It will automatically pick up GOOGLE_API_KEY from the environment (.env)
    return ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.2)

def chat_with_agent(message: str) -> str:
    """
    Takes a user message, runs it through the LangChain LLM, and returns the response.
    """
    if not os.getenv("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY") == "your_gemini_api_key_here":
        return "Please set your GOOGLE_API_KEY in the backend/.env file to chat with me!"
        
    try:
        llm = get_llm()
        system_prompt = SystemMessage(content="You are FairLens AI Assistant, a helpful compliance officer. You help users understand AI bias, job description fairness, and dataset mitigation techniques. Keep your answers concise, practical, and formatted neatly.")
        human_msg = HumanMessage(content=message)
        
        response = llm.invoke([system_prompt, human_msg])
        return response.content
    except Exception as e:
        return f"Error communicating with LLM: {str(e)}"
