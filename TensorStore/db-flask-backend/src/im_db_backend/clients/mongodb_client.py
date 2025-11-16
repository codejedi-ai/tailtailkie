import os
from pymongo import MongoClient
from pymongo.database import Database
from typing import Optional


class MongoDBClient:
    _client: Optional[MongoClient] = None
    _database: Optional[Database] = None

    @classmethod
    def get_client(cls) -> MongoClient:
        """Get or create MongoDB client singleton"""
        if cls._client is None:
            database_url = os.getenv("MONGODB_URI") or os.getenv("DATABASE_URL")
            if not database_url:
                raise ValueError("MONGODB_URI or DATABASE_URL environment variable is required")
            
            cls._client = MongoClient(
                database_url,
                serverSelectionTimeoutMS=5000
            )
        return cls._client

    @classmethod
    def get_database(cls, db_name: str = "tensorstore") -> Database:
        """Get database instance"""
        if cls._database is None:
            client = cls.get_client()
            cls._database = client[db_name]
        return cls._database

    @classmethod
    def close(cls):
        """Close MongoDB connection"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._database = None

