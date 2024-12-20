from setuptools import setup, find_packages

setup(
    name="app-generator-cli",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "typer[all]==0.9.0",
        "pydantic==2.6.1",
        "numpy",
        "outlines",
        "rich==13.7.0",
        "python-dotenv==1.0.0",
        "jinja2==3.1.3",
        "supabase==2.3.4",
        "asyncio==3.4.3",
        "aiohttp==3.9.3",
        "rich-click==1.7.3",
        "inquirer==3.2.4",
        "colorama==0.4.6",
        "openai",  # Updated to a newer version compatible with Python 3.12
    ],
    entry_points={
        "console_scripts": [
            "generate-app=src.cli:app",
        ],
    },
    python_requires=">=3.8",
)