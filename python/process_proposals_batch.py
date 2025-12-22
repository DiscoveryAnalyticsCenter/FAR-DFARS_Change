#!/usr/bin/env python3
"""
Process a JSON file containing NDAA-DFARS matches and generate proposals for each match.

For each result in each match, calls generate_proposal and adds the proposal and frs
into the match in the original JSON, then writes it all out at the end.
"""

import json
import argparse
import sys
from typing import Dict, Any
from generate_proposal import generate_proposal
from bs4 import BeautifulSoup


def process_json_file(input_file: str, output_file: str = None):
    """
    Process a JSON file and generate proposals for each match.
    
    Args:
        input_file: Path to the input JSON file
        output_file: Optional path to the output JSON file (defaults to input_file with _processed suffix)
    """
    print(f"Loading JSON file: {input_file}")
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error loading JSON file: {e}")
        sys.exit(1)
    
    # Get the year from the top level
    year = data.get('year', '2023')
    print(f"Processing year: {year}")
    
    # Navigate to matches.results
    if 'matches' not in data or 'results' not in data['matches']:
        print("❌ Error: JSON structure doesn't contain 'matches.results'")
        sys.exit(1)
    
    results = data['matches']['results']
    total_results = len(results)
    print(f"Found {total_results} results to process")
    
    # Count total matches
    total_matches = sum(len(result.get('matches', [])) for result in results)
    print(f"Total matches across all results: {total_matches}")
    
    # Process each result
    processed_matches = 0
    failed_matches = 0
    
    for result_idx, result in enumerate(results, 1):
        ndaa_number = result.get('ndaa_number')
        matches = result.get('matches', [])
        ndaa_html = result.get('ndaa_html')
        ndaa_text = BeautifulSoup(ndaa_html or '', 'html.parser').text
        dfars_text = result.get('section_text')
        
        if not ndaa_number:
            print(f"⚠️  Warning: Result {result_idx} missing ndaa_number, skipping")
            continue
        
        print(f"\n[{result_idx}/{total_results}] Processing NDAA Section {ndaa_number} ({len(matches)} matches)...")
        
        # Process each match in this result
        for match_idx, match in enumerate(matches):
            if match_idx > 0 and match_idx < 5:
                pass
            else:
                continue
            section_number = match.get('section_number')
            
            if not section_number:
                print(f"  ⚠️  Warning: Match {match_idx} missing section_number, skipping")
                continue
            
            processed_matches += 1
            print(f"  [{processed_matches}/{total_matches}] Generating proposal for DFARS {section_number}...")
            
            try:
                # Generate proposal
                proposal_data = generate_proposal(ndaa_number, ndaa_text, year, section_number, dfars_text)
                
                # Add proposal and frs to the match
                match['proposal'] = proposal_data['proposal']
                match['frs'] = proposal_data['frs']
                
                print(f"  ✅ Successfully generated proposal for {section_number}")
                
            except Exception as e:
                failed_matches += 1
                print(f"  ❌ Error generating proposal for {section_number}: {e}")
                # Continue processing other matches even if one fails
                continue
    
    # Determine output file
    if output_file is None:
        # Create output filename by adding _processed before .json
        if input_file.endswith('.json'):
            output_file = input_file.replace('.json', '_processed.json')
        else:
            output_file = input_file + '_processed'
    
    # Write the updated JSON
    print(f"\nWriting results to {output_file}...")
    try:
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"✅ Successfully wrote processed data to {output_file}")
    except Exception as e:
        print(f"❌ Error writing output file: {e}")
        sys.exit(1)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"Processing complete!")
    print(f"  Total matches processed: {processed_matches}")
    print(f"  Failed matches: {failed_matches}")
    print(f"  Success rate: {((processed_matches - failed_matches) / processed_matches * 100):.1f}%" if processed_matches > 0 else "N/A")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(
        description="Process a JSON file and generate proposals for each NDAA-DFARS match"
    )
    parser.add_argument(
        "input_file",
        type=str,
        help="Path to the input JSON file (e.g., 2023_pairs.json)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=None,
        help="Path to the output JSON file (defaults to input_file with _processed suffix)"
    )
    
    args = parser.parse_args()
    process_json_file(args.input_file, args.output)


if __name__ == "__main__":
    main()

