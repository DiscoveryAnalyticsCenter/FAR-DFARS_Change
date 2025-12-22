#!/bin/bash

# Script to process proposal comments
# Iterates through proposal IDs and handles fetching and grouping comments

COMMENTS_DIR="comments"
PROPOSAL_IDS_FILE="proposal_ids.txt"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Check if proposal_ids.txt exists
if [ ! -f "$PROPOSAL_IDS_FILE" ]; then
    echo "Error: $PROPOSAL_IDS_FILE not found"
    exit 1
fi

# Read proposal IDs and process each one
while IFS= read -r proposal_id || [ -n "$proposal_id" ]; do
    # Skip empty lines
    [ -z "$proposal_id" ] && continue
    
    echo "Processing proposal: $proposal_id"
    
    grouped_file="${COMMENTS_DIR}/proposal_data_${proposal_id}_grouped.json"
    json_file="${COMMENTS_DIR}/proposal_data_${proposal_id}.json"
    
    # Step 2: Check if grouped file already exists
    if [ -f "$grouped_file" ]; then
        echo "  Grouped file already exists, skipping..."
        continue
    fi
    
    # Step 3-5: Check if JSON file exists
    if [ -f "$json_file" ]; then
        echo "  Found existing JSON file: $json_file"
        
        # Check if lastPage is true using jq
        last_page=$(jq -r '.comment_metadata.lastPage' "$json_file" 2>/dev/null)
        
        if [ "$last_page" = "true" ]; then
            echo "  Last page is true, running group_comments.py..."
            python3 group_comments.py "$json_file"
            if [ $? -ne 0 ]; then
                echo "Error: group_comments.py failed for $proposal_id (possibly 429 rate limit)"
                exit 1
            fi
        else
            echo "  Last page is false, resuming comment fetch..."
            page_number=$(jq -r '.comment_metadata.pageNumber' "$json_file" 2>/dev/null)
            echo "  Resuming from page: $page_number"
            
            # Run get_comments.py with resume argument
            # Note: get_comments.py saves to current directory, so we'll need to move it
            python3 get_comments.py "$proposal_id" --resume "$json_file"
            if [ $? -ne 0 ]; then
                echo "Error: get_comments.py failed for $proposal_id (possibly 429 rate limit)"
                exit 1
            fi
            
            # Move the file if it was created in current directory
            temp_json_file="proposal_data_${proposal_id}.json"
            if [ -f "$temp_json_file" ] && [ "$temp_json_file" != "$json_file" ]; then
                mv "$temp_json_file" "$json_file"
            fi
            
            # Then run group_comments.py
            if [ -f "$json_file" ]; then
                echo "  Running group_comments.py..."
                python3 group_comments.py "$json_file"
                if [ $? -ne 0 ]; then
                    echo "Error: group_comments.py failed for $proposal_id (possibly 429 rate limit)"
                    exit 1
                fi
            else
                echo "  Warning: JSON file not found after get_comments.py"
            fi
        fi
    else
        # Step 6: No files exist for this ID
        echo "  No files found for this proposal ID, fetching comments..."
        
        # Run get_comments.py (it will create file in current directory)
        python3 get_comments.py "$proposal_id"
        if [ $? -ne 0 ]; then
            echo "Error: get_comments.py failed for $proposal_id (possibly 429 rate limit)"
            exit 1
        fi
        
        # Move file to comments directory if it was created in current directory
        temp_json_file="proposal_data_${proposal_id}.json"
        if [ -f "$temp_json_file" ]; then
            # Ensure comments directory exists
            mkdir -p "$COMMENTS_DIR"
            mv "$temp_json_file" "$json_file"
        fi
        
        # Run group_comments.py
        if [ -f "$json_file" ]; then
            echo "  Running group_comments.py..."
            python3 group_comments.py "$json_file"
            if [ $? -ne 0 ]; then
                echo "Error: group_comments.py failed for $proposal_id (possibly 429 rate limit)"
                exit 1
            fi
        else
            echo "  Warning: JSON file not found after get_comments.py"
        fi
    fi
    
    echo ""
done < "$PROPOSAL_IDS_FILE"

echo "Processing complete!"

