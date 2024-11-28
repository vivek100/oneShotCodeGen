from langchain.chains import LLMChain
from ai_code_generator_cli.prompts.code_generation_prompts import get_code_generation_prompts
from ai_code_generator_cli.utils.memory_utils import create_memory
from .requirements_chain import get_llm, ModelProvider
from ai_code_generator_cli.utils.template_utils import load_template
import logging
import os

logger = logging.getLogger(__name__)

def create_code_chains(
    model_provider: ModelProvider,
    code_version: str,
    backend_template: str = None,
    frontend_template: str = None
) -> dict:
    """Create code generation chains based on version configuration."""
    try:
        # Only load templates if they're provided and we're using v3
        if code_version == "v3":
            if backend_template:
                #backend_template = os.path.join(os.path.dirname(__file__), '..', '..', 'templates', 'backend.txt')
                backend_template = load_template(backend_template)
            if frontend_template:
                #frontend_template = os.path.join(os.path.dirname(__file__), '..', '..', 'templates', 'frontend.txt')
                frontend_template = load_template(frontend_template)
        else:
            # For v1 and v2, ignore any template arguments
            backend_template = None
            frontend_template = None
            
        # Get prompts for the specified version
        prompts = get_code_generation_prompts(
            code_version,
            backend_template,
            frontend_template
        )
        chains = {}
        
        # Create a chain for each prompt type
        for prompt_type, prompt in prompts.items():
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