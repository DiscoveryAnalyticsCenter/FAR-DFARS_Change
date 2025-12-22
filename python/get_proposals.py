import os
import requests
import json
from typing import Dict, Any, Protocol
import argparse

def get_proposals(page: int = 1) -> Dict[str, Any]:
    """
    Fetch proposals from the regulations.gov API
    
    Args:
        page: Page number to fetch (defaults to 1)
        
    Returns:
        Dictionary containing proposals data and metadata
        
    Raises:
        requests.RequestException: If the API request fails
    """
    # Get API key from environment variables
    api_key = os.getenv('REGULATIONS_GOV_API_KEY')
    if not api_key:
        raise ValueError("REGULATIONS_GOV_API_KEY environment variable is required")
    
    # Construct the API URL
    url = f"https://api.regulations.gov/v4/documents"
    params = {
        'filter[documentType]': 'Proposed Rule',
        'filter[agencyId]': 'FAR',
        'page[number]': page,
        'api_key': api_key
    }
    
    try:
        # Make the API request
        response = requests.get(url, params=params)
        
        # Check if request was successful
        if response.status_code != 200:
            raise requests.RequestException(f"API request failed with status {response.status_code}")
        
        # Parse JSON response
        prs_data = response.json()
        meta = prs_data.get('meta', {})
        
        # Structure return data
        return_data = {
            'proposals': prs_data.get('data', []),
            'totalDocuments': meta.get('totalElements', 0),
            'pageNumber': meta.get('pageNumber', page),
            'hasNextPage': meta.get('hasNextPage', False),
            'hasPrevPage': meta.get('hasPreviousPage', False)
        }
        
        return return_data
        
    except requests.RequestException as e:
        raise requests.RequestException(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    # use argparse for option string argument called "resume"
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", type=str, default="")
    args = parser.parse_args()

    page = 1
    hasNextPage = True
    if args.resume:
        # open resume as a json file
        with open(args.resume, "r") as f:
            resume = json.load(f)
        # get page number from resume
        page = int(resume["pageNumber"])
        hasNextPage = resume["hasNextPage"]

    # print("Need to extend old proposals with new ones")
    # None()
    proposals = None
    try:
        while hasNextPage:
            print(f"Fetching page {page}")
            next_page = get_proposals(page=page)
            if proposals is None:
                proposals = next_page
            else:
                proposals["proposals"].extend(next_page["proposals"])

            # save proposals to json so we don't lose progress
            with open("proposals.json", "w") as f:
                json.dump(proposals, f)
            
            # move on to next page
            page += 1
            hasNextPage = next_page["hasNextPage"]

    except Exception as e:
        print(f"Error: {e}")
