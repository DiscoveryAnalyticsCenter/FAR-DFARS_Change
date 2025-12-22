import os
import requests
from typing import Dict, List, Any, Optional
import re
from dataclasses import dataclass
from datetime import datetime
import argparse
import json

@dataclass
class ProposalComment:
    """Data class representing a proposal comment"""
    links: Dict[str, str]

def strip_html(text: str) -> str:
    """
    Strip HTML tags from text
    
    Args:
        text: HTML text to clean
        
    Returns:
        Clean text without HTML tags
    """
    if not text:
        return ""
    # Remove HTML tags using regex
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

def fetch_comment(url: str, api_key: str) -> str:
    """
    Fetch a single comment from the regulations.gov API
    
    Args:
        url: API URL for the comment
        api_key: API key for regulations.gov
        
    Returns:
        Cleaned comment text
    """
    try:
        response = requests.get(f"{url}?api_key={api_key}")
        response.raise_for_status()
        data = response.json()
        
        comment_text = data.get('data', {}).get('attributes', {}).get('comment', '')
        return strip_html(comment_text)
    except requests.RequestException:
        return ""

def fetch_all_comments(comments: List[ProposalComment], api_key: str) -> List[str]:
    """
    Fetch all comments content
    
    Args:
        comments: List of comment objects with links
        api_key: API key for regulations.gov
        
    Returns:
        List of comment text content
    """
    comments_content = []
    
    for comment in comments:
        content = fetch_comment(comment.links['self'], api_key)
        if content and len(content) > 0:
            comments_content.append(content)
    
    return comments_content

def get_proposal_with_comments(proposal_id: str, resume: str) -> Dict[str, Any]:
    """
    Fetch proposal data with comments, clustering, and analysis
    
    Args:
        proposal_id: ID of the proposal to fetch
        
    Returns:
        Dictionary containing proposal data with processed comments
        
    Raises:
        requests.RequestException: If API requests fail
        ValueError: If API key is missing
    """
    # Get API key from environment
    api_key = os.getenv('REGULATIONS_GOV_API_KEY')
    if not api_key:
        raise ValueError("REGULATIONS_GOV_API_KEY environment variable is required")
    
    # save timestamp of when we started
    start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        if resume:
            proposal = {}
            with open(resume) as f:
                proposal["data"] = json.load(f)
        else:
            # Fetch proposal data
            proposal_response = requests.get(
                f"https://api.regulations.gov/v4/documents/{proposal_id}?api_key={api_key}"
            )
            proposal_response.raise_for_status()
            proposal = proposal_response.json()
        
        # Get object ID for fetching comments
        object_id = proposal['data']['attributes']['objectId']
        # print out object id
        print("Object ID returned {}".format(object_id))
        
        # Fetch all comments (handle pagination)
        comments = [] if "comments" not in proposal["data"] else proposal["data"]["comments"]
        is_last_page = False if "comment_metadata" not in proposal["data"] else proposal["data"]["comment_metadata"]["lastPage"]
        page = 1 if "comment_metadata" not in proposal["data"] else proposal["data"]["comment_metadata"]["pageNumber"] + 1
        meta = {}
        
        while not is_last_page:
            print("Fetching page {}".format(page))
            comments_response = requests.get(
                f"https://api.regulations.gov/v4/comments",
                params={
                    'filter[commentOnId]': object_id,
                    'page[number]': page,
                    'api_key': api_key
                }
            )
            comments_response.raise_for_status()
            comment_data = comments_response.json()
            print("Comment data returned")
            
            # Convert to ProposalComment objects
            comment_objects = [
                ProposalComment(links=comment.get('links', {}))
                for comment in comment_data.get('data', [])
            ]
            
            # Fetch comment content
            new_comments = fetch_all_comments(comment_objects, api_key)
            comments.extend(new_comments)
        
            # Check if this is the last page
            meta = comment_data.get('meta', {})
            is_last_page = meta.get('lastPage', True)
            page += 1
        
    except requests.RequestException as e:
        print(f"An unexpected error occurred: {str(e)}")

    # Combine proposal data with processed comments
    proposal_data = {
        **proposal['data'],
        'comments': comments,
        'comment_metadata': meta,
        'start_time': start_time,
    }
    
    return proposal_data

def main(proposal_id: str, resume: str):
    try:
        # Replace with actual proposal ID
        proposal_data = get_proposal_with_comments(proposal_id, resume)

        # save proposal data to json
        with open(f"proposal_data_{proposal_id}.json", "w") as f:
            json.dump(proposal_data, f)

        print(f"Proposal data saved to proposal_data_{proposal_id}.json")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # use argparse to get proposal id
    parser = argparse.ArgumentParser()
    parser.add_argument("proposal_id", type=str)
    parser.add_argument("--resume", type=str)
    args = parser.parse_args()
    main(args.proposal_id, args.resume)
