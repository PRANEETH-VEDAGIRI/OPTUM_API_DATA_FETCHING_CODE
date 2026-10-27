from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import json

import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Optum Eligibility API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OPTUM_URL = "https://sandbox-apigw.optum.com/medicalnetwork/eligibility/v3/"
TOKEN_URL = os.getenv("TOKEN_URL", "https://sandbox-apigw.optum.com/apip/auth/v2/token")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
GRANT_TYPE = os.getenv("GRANT_TYPE", "client_credentials")

# Request Models
class Provider(BaseModel):
    organizationName: str
    npi: str

class Subscriber(BaseModel):
    memberId: str
    firstName: str
    lastName: str
    dateOfBirth: str
    gender: str

class EligibilityRequest(BaseModel):
    controlNumber: str
    tradingPartnerServiceId: str
    provider: Provider
    subscriber: Subscriber
    serviceTypeCodes: List[str]

def get_optum_token():
    """
    Fetch OAuth2 token from Optum.
    """
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": GRANT_TYPE
    }
    headers = {"content-type": "application/json"}
    
    try:
        response = requests.post(TOKEN_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json().get("access_token")
    except Exception as e:
        print(f"Error fetching token: {str(e)}")
        if 'response' in locals():
            print(f"Token error body: {response.text}")
        raise HTTPException(status_code=500, detail="Failed to authenticate with Optum API")

@app.post("/eligibility")
async def get_eligibility(request_data: EligibilityRequest):
    """
    Fetch eligibility information from Optum API using Bearer Token.
    """
    token = get_optum_token()
    
    payload = {
        "controlNumber": request_data.controlNumber,
        "tradingPartnerServiceId": request_data.tradingPartnerServiceId,
        "provider": {
            "organizationName": request_data.provider.organizationName,
            "npi": request_data.provider.npi
        },
        "subscriber": {
            "memberId": request_data.subscriber.memberId,
            "firstName": request_data.subscriber.firstName,
            "lastName": request_data.subscriber.lastName,
            "dateOfBirth": request_data.subscriber.dateOfBirth,
            "gender": request_data.subscriber.gender
        },
        "serviceTypeCodes": request_data.serviceTypeCodes
    }
    
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    try:
        print(f"Payload sent to Optum: {json.dumps(payload, indent=2)}")
        response = requests.post(OPTUM_URL, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Optum API Error Body: {response.text}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=f"Optum API Error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)