from typing import List, Dict, Any
import numpy as np
import argparse
import json
import os
import requests
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer
from openai import AzureOpenAI



# Global model variable for caching
_model = None
_client = None

# OpenAI API configuration
OPENAI_MODEL = "gpt-4o-mini"
TEMPERATURE = 0.7

def load_client():
    global _client
    if _client is None:
        api_key = os.getenv('OPENAI_API_KEY')
        _client = AzureOpenAI(
            api_version="2024-12-01-preview",
            azure_endpoint="https://dfars-openai.openai.azure.com/",
            api_key=api_key,
        )
    return _client


def load_model():
    """
    Load and cache the sentence transformer model
    
    Returns:
        SentenceTransformer model instance
    """
    global _model
    if _model is None:
        print("Loading sentence transformer model...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')  # Lightweight, good performance
        print("✅ Sentence transformer model loaded and cached!")
    return _model

def get_comment_embeddings(comments: List[str], batch_size: int = 32) -> np.ndarray:
    """
    Generate embeddings for comments using sentence transformers
    
    Args:
        comments: List of comment strings
        batch_size: Number of comments to process at once
        
    Returns:
        NumPy array of embeddings
    """
    model = load_model()
    
    # Process in batches to manage memory
    embeddings = []
    for i in range(0, len(comments), batch_size):
        batch = comments[i:i + batch_size]
        batch_embeddings = model.encode(batch)
        embeddings.extend(batch_embeddings)
    
    return np.array(embeddings)

def cluster_comments(comments: List[str], num_clusters: int = 5) -> List[List[str]]:
    """
    Cluster comments using embeddings and k-means
    
    Args:
        comments: List of comment strings
        num_clusters: Number of clusters to create
        
    Returns:
        List of comment clusters (groups)
    """
    if len(comments) <= num_clusters:
        # If we have fewer comments than clusters, return individual clusters
        return generate_fake_clusters(comments)
    
    # Get embeddings for all comments
    embeddings = get_comment_embeddings(comments)
    
    # Perform k-means clustering
    kmeans = KMeans(n_clusters=num_clusters)
    cluster_labels = kmeans.fit_predict(embeddings)
    
    # Group comments by cluster
    groups = group_items_by_cluster(comments, cluster_labels)
    return groups

def group_items_by_cluster(items: List[str], cluster_labels: np.ndarray) -> List[List[str]]:
    """
    Group items based on their cluster labels
    
    Args:
        items: List of items to group
        cluster_labels: Array of cluster labels for each item
        
    Returns:
        List of grouped items
    """
    grouped = {}
    
    # Group items by their cluster label
    for item, cluster_id in zip(items, cluster_labels):
        if cluster_id not in grouped:
            grouped[cluster_id] = []
        grouped[cluster_id].append(item)
    
    return list(grouped.values())

def generate_fake_clusters(comments: List[str]) -> List[List[str]]:
    """
    Generate individual clusters for each comment (fallback when not enough comments for real clustering)
    
    Args:
        comments: List of comment strings
        
    Returns:
        List of comment groups (each comment in its own group)
    """
    return [[comment] for comment in comments]

def _make_openai_request(messages: List[Dict[str, str]]) -> str:
    """
    Make a request to Azure OpenAI API using the client
    
    Args:
        messages: List of message dictionaries for the chat completion
        
    Returns:
        Response content from OpenAI
        
    Raises:
        Exception: If API request fails
    """
    try:
        client = load_client()
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=TEMPERATURE
        )
        return response.choices[0].message.content
        
    except Exception as e:
        raise Exception(f"Azure OpenAI API request failed: {str(e)}")

def summarize(comments: List[str]) -> Dict[str, str]:
    """
    Summarize a group of comments using OpenAI
    
    Args:
        comments: List of comment strings to summarize
        
    Returns:
        Dictionary with summary and title
    """
    if not comments:
        return {'summary': "No comments", 'title': "Empty"}
    
    comment_string = "&&&".join(comments)
    
    try:
        # Generate summary
        summary_messages = [
            {
                "role": "system",
                "content": 'You are a service which will aggregate a list of comments regarding a government FARS proposal, with each separate proposal separated by a "&&&", into one brief summary (two short sentences, max). You will not be given instructions each request, just summarize. Do not refer to the comments, just mention their content'
            },
            {
                "role": "user",
                "content": comment_string
            }
        ]
        
        summary_content = _make_openai_request(summary_messages)
        
        # Generate title
        title_messages = [
            {
                "role": "user",
                "content": f'Generate a short title (no more than five words) for the following comment list, with each separate comment separated by a \'&&&\' which represents the overall, general content of the comments. The title should be as detailed as possible about the comment content. Specifically mention key words from within the comments. The comment list follows: {comment_string}'
            }
        ]
        
        title_content = _make_openai_request(title_messages)
        
        return {
            'summary': summary_content,
            'title': title_content.replace('"', '')
        }
        
    except Exception as e:
        print(f"Error in summarization: {e}")
        # Fallback to basic summary
        return {
            'summary': comments[0] if comments else "No comments",
            'title': "Comment Summary"
        }

def summarize_overall(summaries: List[str]) -> str:
    """
    Create an overall summary from multiple comment summaries
    
    Args:
        summaries: List of summary strings
        
    Returns:
        Overall summary string
    """
    if not summaries:
        return "No summaries available"
    
    summary_string = "&&&".join(summaries)
    
    try:
        messages = [
            {
                "role": "system",
                "content": 'You are a service which will aggregate a list of comment summaries regarding a government FARS proposal, with each separate summary separated by a "&&&", into one brief summary (two short sentences, max). You will not be given instructions each request, just summarize. Do not refer to the summaries, just mention their content'
            },
            {
                "role": "user",
                "content": summary_string
            }
        ]
        
        return _make_openai_request(messages)
        
    except Exception as e:
        print(f"Error in overall summarization: {e}")
        return summaries[0] if summaries else "No summaries available"

def generate_revision(summary: str) -> str:
    """
    Generate revision suggestion based on summary using OpenAI
    
    Args:
        summary: Summary text to generate revision from
        
    Returns:
        Revision suggestion text
    """
    if not summary:
        return "No revision suggested for empty summary"
    
    try:
        messages = [
            {
                "role": "system",
                "content": """You will be given a comment that was made on a proposed rule for the Federal Aquisition Regulation rules. 
        The comment details a problem that a reader had with the proposal. Please suggest a brief (no more than 5 short sentences) revision which could resolve the problem outlined by the comment. 
        Format your response as specific revisions which could be made to current Federal Aquisition Rules, referring to the document where appropiate. Your response should NOT be in first-person,
        but rather should only discuss the specific changes needed to be made. If the comment seems to refer to an external document, return ONLY an empty string."""
            },
            {
                "role": "user",
                "content": summary
            }
        ]
        
        return _make_openai_request(messages)
        
    except Exception as e:
        print(f"Error in revision generation: {e}")
        return f"Suggested revision based on: {summary[:100]}..."


def group_comments(comments: List[str], num_clusters: int = 5) -> List[Dict[str, Any]]:
    """
    Group comments into clusters and generate summaries and revisions
    
    Args:
        comments: List of comment strings
        num_clusters: Number of clusters to create
        
    Returns:
        List of comment groups with summaries and revision suggestions
    """
    # Group comments (cluster if enough comments, otherwise individual groups)
    grouped_comments = cluster_comments(comments, num_clusters)
    
    # Process each group of comments
    summarized_groups = []
    
    for group in grouped_comments:
        # Generate summary
        summary = summarize(group)
        
        # Generate revision suggestion
        revision_suggestion = generate_revision(summary['summary'])
        
        # Create comment data structure
        comment_data = {
            'comments': group,
            'summary': summary['summary'],
            'title': summary['title'],
            'revisionSuggestion': revision_suggestion
        }
        summarized_groups.append(comment_data)
    
    return summarized_groups
    

if __name__ == "__main__":
    # use argparse to get proposal_data json file
    parser = argparse.ArgumentParser(description="Group comments from proposal data using clustering")
    parser.add_argument("proposal_data_file", type=str, help="Path to proposal data JSON file")
    parser.add_argument("--num_clusters", type=int, default=5, help="Number of clusters to create (default: 5)")
    args = parser.parse_args()
    
    try:
        # Load proposal data
        with open(args.proposal_data_file, 'r') as f:
            proposal_data = json.load(f)
        
        comments = proposal_data.get('comments', [])
        if len(comments) < args.num_clusters:
            print("Fewer comments ({}) than clusters, aborting".format(len(comments)))
            exit(0)

        print(f"Processing {len(comments)} comments...")
        
        num_clusters = args.num_clusters
        if len(comments) < 25:
            num_clusters = 3
            print("Downconverting number of clusters to {} for {} comments".format(num_clusters, len(comments)))

        # Group comments
        grouped_comments = group_comments(comments, args.num_clusters)

        overall_summary = summarize_overall([group['summary'] for group in grouped_comments])

        data = {
            "id": proposal_data.get("id", ""),
            "title": proposal_data.get("attributes", {}).get("title", ""),
            "cfrPart": proposal_data.get("attributes", {}).get("cfrPart", ""),
            "comments": {
                "summary": overall_summary,
                "groups": grouped_comments
            }
        }
        
        # Create output filename
        output_file = args.proposal_data_file.replace(".json", "_grouped.json")
        
        # Save grouped comments to json
        with open(output_file, "w") as f:
            json.dump(data, f)
        
    except Exception as e:
        print(f"Error: {e}")