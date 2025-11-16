from http import HTTPStatus
from typing import Dict, Any, List, Optional
from bson import ObjectId
from datetime import datetime

from dependency_injector.wiring import Provide, inject
from flask import request

from im_db_backend.common.exceptions import APIException
from im_db_backend.clients.mongodb_client import MongoDBClient
from im_db_backend.clients.milvus_client import MilvusClientWrapper
from im_db_backend.resources.clerk_auth.services import ClerkAuthService


class DatasetService:
    """Service for dataset operations"""

    @inject
    def __init__(
        self,
        clerk_auth_service=Provide["services.clerk_auth_service"],
    ):
        self.clerk_auth_service = clerk_auth_service

    def list_datasets(
        self,
        search: Optional[str] = None,
        user_id: Optional[str] = None,
        format: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """List datasets with filtering"""
        db = MongoDBClient.get_database()
        datasets_collection = db.datasets
        
        # Build query
        query: Dict[str, Any] = {"isPublic": True}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]
        
        if user_id:
            # Handle both Clerk ID and MongoDB ObjectID
            if user_id.startswith("user_"):
                users_collection = db.users
                user = users_collection.find_one({"clerkId": user_id})
                if user:
                    query["userId"] = user["_id"]
                else:
                    return {"datasets": [], "total": 0, "limit": limit, "offset": offset}
            else:
                try:
                    query["userId"] = ObjectId(user_id)
                except:
                    return {"datasets": [], "total": 0, "limit": limit, "offset": offset}
            # Remove isPublic filter for user's own datasets
            query.pop("isPublic", None)
        
        if format:
            query["fileFormat"] = format
        
        # Get total count
        total = datasets_collection.count_documents(query)
        
        # Get datasets
        datasets = list(
            datasets_collection.find(query)
            .sort("createdAt", -1)
            .skip(offset)
            .limit(limit)
        )
        
        # Populate user and tensor information
        users_collection = db.users
        tensors_collection = db.tensors
        dimensions_collection = db.dimensions
        
        for dataset in datasets:
            # Get user info
            user = users_collection.find_one({"_id": dataset["userId"]})
            if user:
                dataset["user"] = {
                    "id": str(user["_id"]),
                    "username": user.get("username"),
                    "email": user.get("email"),
                }
            
            # Get tensors
            tensor_list = list(tensors_collection.find({"datasetId": dataset["_id"]}))
            for tensor in tensor_list:
                # Get dimensions
                dimensions = list(dimensions_collection.find({"tensorId": tensor["_id"]}))
                tensor["dimensions"] = dimensions
            
            dataset["tensors"] = tensor_list
            dataset["_count"] = {
                "downloads": db.downloads.count_documents({"datasetId": dataset["_id"]})
            }
            
            # Convert ObjectIds to strings
            dataset["id"] = str(dataset["_id"])
            dataset["userId"] = str(dataset["userId"])
            for tensor in dataset["tensors"]:
                tensor["id"] = str(tensor["_id"])
                tensor["datasetId"] = str(tensor["datasetId"])
                for dim in tensor["dimensions"]:
                    dim["id"] = str(dim["_id"])
                    dim["tensorId"] = str(dim["tensorId"])
        
        return {
            "datasets": datasets,
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_dataset(self, dataset_id: str) -> Dict[str, Any]:
        """Get a single dataset by ID"""
        db = MongoDBClient.get_database()
        datasets_collection = db.datasets
        
        try:
            dataset = datasets_collection.find_one({"_id": ObjectId(dataset_id)})
        except:
            raise APIException(
                status_code=int(HTTPStatus.NOT_FOUND),
                payload={"message": "Dataset not found"},
            )
        
        if not dataset:
            raise APIException(
                status_code=int(HTTPStatus.NOT_FOUND),
                payload={"message": "Dataset not found"},
            )
        
        # Populate related data
        users_collection = db.users
        tensors_collection = db.tensors
        dimensions_collection = db.dimensions
        
        user = users_collection.find_one({"_id": dataset["userId"]})
        if user:
            dataset["user"] = {
                "id": str(user["_id"]),
                "username": user.get("username"),
                "email": user.get("email"),
            }
        
        tensor_list = list(tensors_collection.find({"datasetId": dataset["_id"]}))
        for tensor in tensor_list:
            dimensions = list(dimensions_collection.find({"tensorId": tensor["_id"]}))
            tensor["dimensions"] = dimensions
        
        dataset["tensors"] = tensor_list
        dataset["_count"] = {
            "downloads": db.downloads.count_documents({"datasetId": dataset["_id"]})
        }
        
        # Convert ObjectIds to strings
        dataset["id"] = str(dataset["_id"])
        dataset["userId"] = str(dataset["userId"])
        for tensor in dataset["tensors"]:
            tensor["id"] = str(tensor["_id"])
            tensor["datasetId"] = str(tensor["datasetId"])
            for dim in tensor["dimensions"]:
                dim["id"] = str(dim["_id"])
                dim["tensorId"] = str(dim["tensorId"])
        
        return dataset

    def create_dataset(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new dataset"""
        # Authenticate user
        user_info = self.clerk_auth_service.require_auth()
        user_id = ObjectId(user_info["userId"])
        
        # Validate required fields
        if not data.get("name"):
            raise APIException(
                status_code=int(HTTPStatus.BAD_REQUEST),
                payload={"message": "Dataset name is required"},
            )
        
        if not data.get("tensors") or len(data["tensors"]) == 0:
            raise APIException(
                status_code=int(HTTPStatus.BAD_REQUEST),
                payload={"message": "At least one tensor is required"},
            )
        
        # Check if Milvus is configured
        if not MilvusClientWrapper.is_configured():
            raise APIException(
                status_code=int(HTTPStatus.SERVICE_UNAVAILABLE),
                payload={"message": "Milvus vector store is not configured"},
            )
        
        db = MongoDBClient.get_database()
        datasets_collection = db.datasets
        tensors_collection = db.tensors
        dimensions_collection = db.dimensions
        
        # Calculate total size
        total_size = 0
        for tensor in data["tensors"]:
            shape = tensor["shape"]
            element_count = 1
            for dim in shape:
                element_count *= dim
            
            dtype = tensor.get("dtype", "float32")
            bytes_per_element = 8 if "float64" in dtype or "int64" in dtype else \
                               4 if "float32" in dtype or "int32" in dtype else \
                               2 if "float16" in dtype or "int16" in dtype else 1
            total_size += element_count * bytes_per_element
        
        # Determine file format
        first_tensor = data["tensors"][0]
        file_name = first_tensor["fileName"]
        ext = file_name.split(".")[-1].lower() if "." in file_name else ""
        file_format = "pt" if ext == "pth" else "h5" if ext == "hdf5" else ext
        
        # Create dataset
        now = datetime.utcnow()
        dataset_id = ObjectId()
        
        dataset = {
            "_id": dataset_id,
            "name": data["name"],
            "description": data.get("description"),
            "userId": user_id,
            "totalSize": total_size,
            "fileFormat": file_format,
            "tags": data.get("tags"),
            "isPublic": data.get("isPublic", True),
            "downloadCount": 0,
            "viewCount": 0,
            "createdAt": now,
            "updatedAt": now,
        }
        
        datasets_collection.insert_one(dataset)
        
        # Create tensors and dimensions
        tensor_list = []
        for tensor_data in data["tensors"]:
            tensor_id = ObjectId()
            tensor = {
                "_id": tensor_id,
                "datasetId": dataset_id,
                "fileName": tensor_data["fileName"],
                "filePath": f"milvus://{tensor_data['fileName']}",
                "fileSize": 0,  # Will be calculated
                "shape": str(tensor_data["shape"]),
                "dtype": tensor_data["dtype"],
                "createdAt": now,
            }
            
            # Calculate file size
            shape = tensor_data["shape"]
            element_count = 1
            for dim in shape:
                element_count *= dim
            dtype = tensor_data.get("dtype", "float32")
            bytes_per_element = 8 if "float64" in dtype or "int64" in dtype else \
                               4 if "float32" in dtype or "int32" in dtype else \
                               2 if "float16" in dtype or "int16" in dtype else 1
            tensor["fileSize"] = element_count * bytes_per_element
            
            tensors_collection.insert_one(tensor)
            
            # Create dimensions
            for dim_data in tensor_data.get("dimensions", []):
                dim = {
                    "_id": ObjectId(),
                    "tensorId": tensor_id,
                    "index": dim_data["index"],
                    "size": dim_data["size"],
                    "name": dim_data["name"],
                    "description": dim_data.get("description"),
                }
                dimensions_collection.insert_one(dim)
            
            # Add dimensions to tensor
            tensor["dimensions"] = list(dimensions_collection.find({"tensorId": tensor_id}))
            for dim in tensor["dimensions"]:
                dim["id"] = str(dim["_id"])
                dim["tensorId"] = str(dim["tensorId"])
            
            tensor["id"] = str(tensor["_id"])
            tensor["datasetId"] = str(tensor["datasetId"])
            tensor_list.append(tensor)
        
        dataset["tensors"] = tensor_list
        dataset["id"] = str(dataset["_id"])
        dataset["userId"] = str(dataset["userId"])
        
        # TODO: Create Milvus collection and process vectors
        # This would be similar to the Next.js implementation
        
        return dataset

