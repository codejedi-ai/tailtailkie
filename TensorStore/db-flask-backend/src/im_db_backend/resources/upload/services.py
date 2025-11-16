from http import HTTPStatus
from typing import List, Dict, Any
import base64
import time
import random
import string

from dependency_injector.wiring import Provide, inject
from werkzeug.datastructures import FileStorage

from im_db_backend.common.exceptions import APIException
from im_db_backend.clients.milvus_client import MilvusClientWrapper
from im_db_backend.resources.clerk_auth.services import ClerkAuthService


class UploadService:
    """Service for file upload operations"""

    @inject
    def __init__(
        self,
        clerk_auth_service=Provide["services.clerk_auth_service"],
    ):
        self.clerk_auth_service = clerk_auth_service

    def upload_files(self, files: List[FileStorage]) -> Dict[str, Any]:
        """Upload files to temporary storage in Milvus"""
        # Authenticate user
        user_info = self.clerk_auth_service.require_auth()
        user_id = user_info["clerkId"]
        
        # Check if Milvus is configured
        if not MilvusClientWrapper.is_configured():
            raise APIException(
                status_code=int(HTTPStatus.SERVICE_UNAVAILABLE),
                payload={"message": "Milvus vector store is not configured"},
            )
        
        # Allowed file extensions
        allowed_extensions = {'.pt', '.pth', '.npy', '.npz', '.safetensors', '.h5', '.hdf5'}
        
        milvus_client = MilvusClientWrapper.get_client()
        TEMP_FILES_COLLECTION = 'temp_tensor_files'
        
        # Ensure temporary collection exists
        try:
            collection_exists = milvus_client.has_collection(TEMP_FILES_COLLECTION)
        except AttributeError:
            # Try alternative API
            try:
                from pymilvus import Collection
                collection_exists = Collection(TEMP_FILES_COLLECTION) is not None
            except:
                collection_exists = False
        
        if not collection_exists:
            # For now, we'll use a simpler approach - store files in MongoDB instead
            # Milvus is better suited for vector data, not file storage
            # This is a temporary solution
            pass
        
        uploaded_files = []
        
        for file in files:
            # Validate file format
            file_name = file.filename
            if not file_name:
                continue
            
            ext = '.' + file_name.split('.')[-1].lower() if '.' in file_name else ''
            if ext not in allowed_extensions:
                continue
            
            # Generate unique ID
            timestamp = int(time.time() * 1000)
            random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=7))
            file_id = f"{timestamp}-{random_str}-{file_name}"
            
            # Read file data
            file_data_bytes = file.read()
            file_data_base64 = base64.b64encode(file_data_bytes).decode('utf-8')
            
            # Prepare data for Milvus
            file_data = {
                "id": file_id,
                "file_name": file_name,
                "user_id": user_id,
                "file_data": file_data_base64,
                "file_size": len(file_data_bytes),
                "uploaded_at": timestamp,
            }
            
            # Store in MongoDB temporarily (Milvus is for vectors, not file storage)
            from im_db_backend.clients.mongodb_client import MongoDBClient
            db = MongoDBClient.get_database()
            temp_files_collection = db.temp_tensor_files
            
            try:
                temp_files_collection.insert_one(file_data)
                
                uploaded_files.append({
                    "fileName": file_id,
                    "originalName": file_name,
                    "size": len(file_data_bytes),
                    "milvusId": file_id,
                })
            except Exception as e:
                # Log error but continue with other files
                print(f"Error uploading file {file_name}: {str(e)}")
                continue
        
        return {"files": uploaded_files}

