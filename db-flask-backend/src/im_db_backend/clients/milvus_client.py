import os
from typing import Optional, Any
try:
    from pymilvus import MilvusClient as PyMilvusClient
except ImportError:
    # Fallback for older versions
    try:
        from pymilvus import connections, Collection
        PyMilvusClient = None
    except ImportError:
        PyMilvusClient = None


class MilvusClientWrapper:
    _client: Optional[Any] = None

    @classmethod
    def is_configured(cls) -> bool:
        """Check if Milvus is configured"""
        uri = os.getenv("MILVUS_URI") or os.getenv("MILVUS_HOST")
        token = os.getenv("MILVUS_TOKEN")
        return bool(uri and token)

    @classmethod
    def get_client(cls) -> Any:
        """Get or create Milvus client singleton"""
        if not cls.is_configured():
            raise ValueError("Milvus is not configured. Set MILVUS_URI and MILVUS_TOKEN environment variables.")
        
        if cls._client is None:
            uri = os.getenv("MILVUS_URI") or os.getenv("MILVUS_HOST")
            token = os.getenv("MILVUS_TOKEN")
            user = os.getenv("MILVUS_USER")
            
            if PyMilvusClient:
                # Use new MilvusClient API
                config: dict[str, Any] = {
                    "uri": uri,
                    "token": token,
                }
                
                if user:
                    config["user"] = user
                
                cls._client = PyMilvusClient(**config)
            else:
                # Fallback to older connections API
                from pymilvus import connections
                connections.connect(
                    alias="default",
                    uri=uri,
                    token=token,
                    user=user if user else None,
                )
                cls._client = connections.get_connection_addr("default")
        
        return cls._client

    @classmethod
    def close(cls):
        """Close Milvus connection"""
        if cls._client:
            try:
                cls._client.close()
            except:
                pass
            cls._client = None

