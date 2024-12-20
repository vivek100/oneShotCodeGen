from typing import Dict, Any, Tuple
from .domain_generator import generate_domain
from .interface_generator import generate_interface

def generate_app(description: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Generate complete application specification including domain and interface models.
    """
    # First generate the domain model
    print("Generating domain model...")
    domain_model = generate_domain(description)
    print("Domain model generated")
    print(domain_model)
    print("Generating interface model...")
    # Then generate the interface based on the domain model
    interface_model = generate_interface(domain_model)
    # generate_interface(domain_model)
    print("Interface model generated")
    print(interface_model)
    
    return domain_model, interface_model 