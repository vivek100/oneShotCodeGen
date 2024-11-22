from setuptools import setup, find_packages
import os

# Get the absolute path to the directory containing setup.py
here = os.path.abspath(os.path.dirname(__file__))

setup(
    name="ai_code_generator_cli",
    version="0.2.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "click>=8.1.7",
        "rich>=13.7.0",
        "langchain>=0.1.0",
        "langchain-community>=0.0.10",
        "langchain-anthropic>=0.0.1",
        "openai>=1.12.0",
        "anthropic>=0.18.1",
        "python-dotenv>=1.0.0",
        "pydantic>=2.6.1",
        "pydantic-settings>=2.1.0"
    ],
    entry_points={
        "console_scripts": [
            "codegen=ai_code_generator_cli.cli:main",
        ],
    },
    python_requires=">=3.8",
) 