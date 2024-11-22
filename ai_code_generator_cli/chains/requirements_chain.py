from langchain_community.chat_models import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.chains import LLMChain, SequentialChain
from ai_code_generator_cli.prompts.requirements_prompts import (
    get_functional_requirements_prompt,
    get_technical_requirements_prompt
)
from ai_code_generator_cli.utils.memory_utils import create_memory
from ai_code_generator_cli.config.settings import settings
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class ModelProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"

def get_llm(provider: ModelProvider, streaming: bool = False):
    """Create LLM based on provider choice."""
    if provider == ModelProvider.OPENAI:
        return ChatOpenAI(
            temperature=0.7,
            model_name="gpt-4o-2024-11-20",
            api_key=settings.openai_api_key,
            streaming=streaming
        )
    elif provider == ModelProvider.ANTHROPIC:
        return ChatAnthropic(
            temperature=0.7,
            model="claude-3-sonnet-20240229",
            anthropic_api_key=settings.anthropic_api_key,
            streaming=streaming
        )
    else:
        raise ValueError(f"Unsupported model provider: {provider}")

def create_requirements_chain(
    model_provider: ModelProvider,
    func_version: str,
    tech_version: str
):
    """Create the requirements generation chain."""
    try:
        # Create LLMs
        functional_llm = get_llm(model_provider)
        technical_llm = get_llm(model_provider)
        logger.debug(f"Created LLMs using provider: {model_provider}")

        # Get version-specific prompts
        functional_prompt = get_functional_requirements_prompt(func_version)
        technical_prompt = get_technical_requirements_prompt(tech_version)

        # Create memory
        functional_memory = create_memory(
            input_key="user_input",
            output_key="functional_requirements"
        )

        technical_memory = create_memory(
            input_key="functional_requirements",
            output_key="technical_requirements"
        )

        # Create chains
        functional_chain = LLMChain(
            llm=functional_llm,
            prompt=functional_prompt,
            output_key="functional_requirements",
            memory=functional_memory
        )

        technical_chain = LLMChain(
            llm=technical_llm,
            prompt=technical_prompt,
            output_key="technical_requirements",
            memory=technical_memory
        )

        # Combine chains
        requirements_chain = SequentialChain(
            chains=[functional_chain, technical_chain],
            input_variables=["user_input"],
            output_variables=["functional_requirements", "technical_requirements"],
            verbose=True
        )

        return requirements_chain

    except Exception as e:
        logger.error(f"Error creating requirements chain: {str(e)}")
        raise 