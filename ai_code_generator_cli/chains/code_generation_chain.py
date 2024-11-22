from langchain.chains import LLMChain
from ai_code_generator_cli.prompts.code_generation_prompts import get_code_generation_prompts
from ai_code_generator_cli.utils.memory_utils import create_memory
from .requirements_chain import get_llm, ModelProvider
import logging

logger = logging.getLogger(__name__)

def create_code_chains(
    model_provider: ModelProvider,
    code_version: str,
    backend_template: str = None,
    frontend_template: str = None
) -> dict:
    """Create code generation chains based on version configuration."""
    try:
        # Get prompts for the specified version
        prompts = get_code_generation_prompts(
            code_version,
            backend_template,
            frontend_template
        )
        chains = {}
        
        # Create a chain for each prompt type
        for prompt_type, prompt in prompts.items():
            # Determine input variables based on prompt type and version
            input_vars = ["functional_requirements", "technical_requirements"]
            if code_version == "v3":
                if prompt_type == "backend" and backend_template:
                    input_vars.append("backend_code_templates")
                elif prompt_type == "frontend" and frontend_template:
                    input_vars.append("frontend_code_templates")
            
            chains[prompt_type] = LLMChain(
                llm=get_llm(model_provider),
                prompt=prompt,
                verbose=True
            )
            logger.debug(f"Created chain for {prompt_type}")
        
        return chains

    except Exception as e:
        logger.error(f"Error creating code generation chains: {str(e)}")
        raise 