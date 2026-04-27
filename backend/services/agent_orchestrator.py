from langchain_core.messages import HumanMessage, SystemMessage
from .llm_helper import get_llm_wrapper
import os

def chat_with_agent(message: str) -> str:
    """
    Takes a user message, runs it through the LangChain LLM, and returns the response.
    """
    wrapper = get_llm_wrapper(temperature=0.2)
    if not wrapper:
        return "Please set your GOOGLE_API_KEY in the backend/.env file to chat with me!"

    try:
        system_prompt = SystemMessage(content="You are FairLens AI Assistant, a helpful compliance officer. You help users understand AI bias, job description fairness, and dataset mitigation techniques. Keep your answers concise, practical, and formatted neatly.")
        human_msg = HumanMessage(content=message)
        response = wrapper.invoke([system_prompt, human_msg])
        return response.content
    except Exception as e:
        return f"Error communicating with LLM: {str(e)}"
