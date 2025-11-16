import os

from setuptools import find_packages, setup

__version__ = "1.1.0"

current_directory = os.path.abspath(os.path.dirname(__file__))
readme_file_location = os.path.join(current_directory, "README.md")

with open(readme_file_location, encoding="utf-8") as readme_file:
    long_description = readme_file.read()

setup(
    name="im_db_backend",
    version=__version__,
    description=(
        "TensorStore Backend API - Flask-based REST API for managing "
        "tensor datasets with MongoDB and Milvus integration."
    ),
    long_description_content_type="text/markdown",
    long_description=long_description,
    author="TensorStore Team",
    python_requires=">=3.8.1",
    package_dir={"": "src"},
    package_data={"": ["*.yml", "*.yaml"]},
    packages=find_packages(where="src"),
    platforms=["Linux", "Mac OS"],
    zip_safe=False,
)
