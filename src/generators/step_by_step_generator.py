from typing import Dict, Any, Tuple
from .use_case_generator import generate_use_cases
from .entity_generator import generate_entities
from .mock_user_generator import generate_mock_users
from .mock_data_generator import generate_mock_data
from .interface_generator import generate_interface
from ..models.base_models import ApplicationDomain

def combine_models(
    use_case_model,
    entity_model,
    mock_user_model,
    mock_data_model
) -> Dict[str, Any]:
    """Combine all partial models into a complete domain model."""
    return {
        "title": use_case_model.title,
        "description": use_case_model.description,
        "use_cases": use_case_model.use_cases,
        "entities": entity_model.entities,
        "mock_users": mock_user_model.mock_users,
        "mock_data": mock_data_model.mock_data
    }

def generate_step_by_step(description: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Generate application specification step by step."""
    # Get use cases
    use_case_model = generate_use_cases(description)
    
    # Get entities using use cases as context
    entity_model = generate_entities(description, use_case_model)
    
    # Get mock users using entities and use cases
    mock_user_model = generate_mock_users(description, use_case_model, entity_model)
    
    # Get mock data using all previous context
    mock_data_model = generate_mock_data(
        description, 
        use_case_model, 
        entity_model, 
        mock_user_model
    )
    
    # Combine into full domain model
    domain_model = combine_models(
        use_case_model,
        entity_model,
        mock_user_model,
        mock_data_model
    )
    
    # Generate interface using complete domain model
    interface_model = generate_interface(domain_model)
    
    return domain_model, interface_model 