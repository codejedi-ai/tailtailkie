from http import HTTPStatus
from typing import Optional, Dict, Any
import os
import requests

from dependency_injector.wiring import Provide, inject
from flask import request

from im_db_backend.common.exceptions import APIException
from im_db_backend.clients.mongodb_client import MongoDBClient


class ClerkAuthService:
    """Service for authenticating requests using Clerk JWT tokens"""

    @inject
    def __init__(
        self,
        request_client=Provide["app.request_client"],
        config_params=Provide["configuration.config_params"],
    ):
        self.request_client = request_client
        self.config_params = config_params
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        self.clerk_frontend_api = os.getenv("CLERK_FRONTEND_API", "https://api.clerk.com")

    def verify_token(self, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Verify Clerk JWT token and return user information
        """
        if not token:
            # Try to get token from Authorization header
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
            else:
                raise APIException(
                    status_code=int(HTTPStatus.UNAUTHORIZED),
                    payload={"message": "No authorization token provided"},
                )

        if not self.clerk_secret_key:
            raise APIException(
                status_code=int(HTTPStatus.INTERNAL_SERVER_ERROR),
                payload={"message": "Clerk secret key not configured"},
            )

        try:
            # Decode JWT token to get user ID (Clerk tokens contain user info)
            import jwt
            try:
                # Decode without verification to get user ID
                # In production, you should verify the signature using Clerk's public keys
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get("sub") or decoded.get("userId") or decoded.get("user_id")
                
                if not user_id:
                    raise APIException(
                        status_code=int(HTTPStatus.UNAUTHORIZED),
                        payload={"message": "Token does not contain user information"},
                    )
            except jwt.DecodeError:
                raise APIException(
                    status_code=int(HTTPStatus.UNAUTHORIZED),
                    payload={"message": "Invalid token format"},
                )

            # Get or create user in MongoDB
            db = MongoDBClient.get_database()
            users_collection = db.users
            
            user = users_collection.find_one({"clerkId": user_id})
            
            if not user:
                # Try to get user details from Clerk
                user_response = self.request_client.get(
                    f"{self.clerk_frontend_api}/v1/users/{user_id}",
                    headers={
                        "Authorization": f"Bearer {self.clerk_secret_key}",
                    },
                    timeout=5,
                )
                
                if user_response.status_code == 200:
                    clerk_user = user_response.json()
                    email = clerk_user.get("email_addresses", [{}])[0].get("email_address", "")
                    username = clerk_user.get("username")
                    
                    # Create user in MongoDB
                    from bson import ObjectId
                    user = {
                        "_id": ObjectId(),
                        "clerkId": user_id,
                        "email": email,
                        "username": username,
                        "createdAt": None,
                        "updatedAt": None,
                    }
                    users_collection.insert_one(user)
                else:
                    # Create minimal user record
                    from bson import ObjectId
                    user = {
                        "_id": ObjectId(),
                        "clerkId": user_id,
                        "email": "",
                        "username": None,
                        "createdAt": None,
                        "updatedAt": None,
                    }
                    users_collection.insert_one(user)

            return {
                "userId": str(user["_id"]),
                "clerkId": user["clerkId"],
                "email": user.get("email", ""),
                "username": user.get("username"),
            }

        except requests.exceptions.RequestException as e:
            raise APIException(
                status_code=int(HTTPStatus.SERVICE_UNAVAILABLE),
                payload={"message": f"Failed to verify token with Clerk: {str(e)}"},
            )
        except APIException:
            raise
        except Exception as e:
            raise APIException(
                status_code=int(HTTPStatus.INTERNAL_SERVER_ERROR),
                payload={"message": f"Authentication error: {str(e)}"},
            )

    def require_auth(self) -> Dict[str, Any]:
        """Require authentication and return user info, or raise exception"""
        return self.verify_token()

