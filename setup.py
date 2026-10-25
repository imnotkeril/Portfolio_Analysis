from setuptools import setup, find_packages

setup(
    name="investment-portfolio-app",
    version="0.1.0",
    packages=find_packages(where="."),
    package_dir={"": "."},
    include_package_data=True,
    install_requires=[
        "streamlit>=1.0.0",
        "pandas>=1.0.0",
        "numpy>=1.0.0",
        "plotly>=5.0.0",
        "matplotlib>=3.0.0",
        "seaborn>=0.11.0",
        "scipy>=1.0.0",
        "yfinance>=0.1.0",
        "requests>=2.0.0",
        "python-dotenv>=1.0.0",
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "pydantic>=2.0.0",
        "python-multipart>=0.0.9",
    ],
)