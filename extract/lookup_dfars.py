import json
import argparse
import os
from urllib.parse import urlparse
from bs4 import BeautifulSoup


def find_section_link(index_soup, section_number):
    """
    Find an <a> tag in index.html that contains the section_number.
    Returns the href value or None if not found.
    """
    # Search for <a> tags that contain the section_number in their text or href
    for link in index_soup.find_all('a'):
        href = link.get('href', '').strip()
        text = link.get_text().strip()
        
        # Check if section_number appears at the start of the href (e.g., "201.303.html")
        # or at the start of the text (e.g., "201.303 Publication...")
        if href.startswith(section_number) or text.startswith(section_number):
            return text, href
    
    return None, None


def find_part_title(index_soup, section_number):
    """
    Find the part title for a given section_number.
    For example, if section_number is "239.7304", find an <a> tag with:
    - href starting with "PART_239"
    - text starting with "Part 239"
    Returns the part title text or None if not found.
    """
    # Extract part number from section_number (e.g., "239" from "239.7304")
    if '.' not in section_number:
        return None
    
    part_number = section_number.split('.')[0]
    
    # Search for <a> tags matching the part criteria
    for link in index_soup.find_all('a'):
        href = link.get('href', '').strip()
        text = link.get_text().strip()
        
        # Check if href starts with "PART_{part_number}" and text starts with "Part {part_number}"
        if text.lower().startswith(f"part {part_number}"):
            return text
    
    return None


def find_subpart_title(index_soup, section_number):
    """
    Find the subpart title for a given section_number.
    For example:
    - "239.7304" -> subpart "239.73"
    - "232.404" -> subpart "232.4"
    - "232.102-70" -> subpart "232.1" (remove dash first, then last 2 digits)
    
    Finds an <a> tag with:
    - href starting with "SUBPART_{subpart_number}"
    - text starting with "Subpart {subpart_number}"
    Returns the subpart title text or None if not found.
    """
    # Remove dash if present (e.g., "232.102-70" -> "232.102")
    section_clean = section_number.split('-')[0]
    
    if '.' not in section_clean:
        return None
    
    # Split by decimal point
    parts = section_clean.split('.')
    if len(parts) < 2:
        return None
    
    part_number = parts[0]
    decimal_part = parts[1]
    
    # Remove last 2 digits from decimal part
    if len(decimal_part) <= 2:
        # If 2 or fewer digits, remove all digits (result is just the part number)
        subpart_number = part_number
    else:
        subpart_decimal = decimal_part[:-2]
        subpart_number = f"{part_number}.{subpart_decimal}"
    
    # Search for <a> tags matching the subpart criteria
    for link in index_soup.find_all('a'):
        href = link.get('href', '').strip()
        text = link.get_text().strip()
        
        # Check if href starts with "SUBPART_{subpart_number}" and text starts with "Subpart {subpart_number}"
        if text.lower().startswith(f"subpart {subpart_number}"):
            return text
    
    return None


def extract_html_content(html_archive_path, href):
    """
    Extract HTML content from a file referenced by href.
    If href has a fragment identifier, extract only that element.
    Otherwise, return the whole file content.
    
    Args:
        html_archive_path: Path to the HTML archive directory
        href: Relative path to HTML file, possibly with fragment (e.g., "201.303.html#some_id")
    
    Returns:
        String containing the HTML content
    """
    # Parse the href to separate file path and fragment
    parsed = urlparse(href)
    file_path = parsed.path
    fragment = parsed.fragment
    
    # Construct full path to the HTML file
    full_path = os.path.join(html_archive_path, file_path)
    
    if not os.path.exists(full_path):
        return None
    
    # Read and parse the HTML file
    with open(full_path, 'r', encoding='utf-8') as f:
        file_soup = BeautifulSoup(f, 'html.parser')

    # h1 = file_soup.find("h1")
    # section_title = h1.get_text(strip=True) if h1 else ""

    # If there's a fragment identifier, find the element with that id
    if fragment:
        element = file_soup.find(id=fragment)
        if element:
            return str(element)
        # If fragment not found, return None or whole file? Let's return whole file as fallback
        return str(file_soup)
    else:
        # No fragment, return the whole file
        return str(file_soup)


def main():
    parser = argparse.ArgumentParser(description='Extract DFARS HTML content from HTML archive')
    parser.add_argument('html_archive', help='Path to HTML archive directory (e.g., dita_html)')
    parser.add_argument('input_file', help='Path to input JSON file')
    parser.add_argument('output_file', help='Path to output JSON file')
    args = parser.parse_args()
    
    # Construct path to index.html
    index_path = os.path.join(args.html_archive, 'index.html')
    
    if not os.path.exists(index_path):
        print(f"Error: index.html not found at {index_path}")
        return
    
    # Load and parse index.html
    print(f"Loading index.html from {index_path}")
    with open(index_path, 'r', encoding='utf-8') as f:
        index_soup = BeautifulSoup(f, 'html.parser')
    
    # Load JSON file
    print(f"Loading JSON from {args.input_file}")
    with open(args.input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process each match
    total_matches = 0
    found_matches = 0
    
    for result in data.get("matches", {}).get("results", []):
        for match in result.get("matches", []):
            total_matches += 1

            if "section_number" in match:
                section_number = match.get("section_number")
            if "subpart" in match:
                section_number = match.get("subpart").split()[-1]

            if not section_number:
                print("Couldn't find section number")
                continue
            
            # Find the link in index.html
            section_title, href = find_section_link(index_soup, section_number)
            
            # Find the part title
            part_title = find_part_title(index_soup, section_number)
            
            # Find the subpart title
            subpart_title = find_subpart_title(index_soup, section_number)
            
            if href:
                # Extract HTML content
                dfars_html = extract_html_content(args.html_archive, href)
                
                if dfars_html:
                    match["dfars_html"] = dfars_html
                    match["section_title"] = section_title
                    if part_title:
                        match["part_title"] = part_title
                    else:
                        print(f"Warning: Could not find part title for section {section_number}")
                    if subpart_title:
                        match["subpart_title"] = subpart_title
                    else:
                        print(f"Warning: Could not find subpart title for section {section_number}")
                    found_matches += 1
                else:
                    print(f"Warning: Could not extract HTML for section {section_number} from {href}")
            else:
                print(f"Warning: Could not find link for section {section_number} in index.html")
    
    print(f"Processed {total_matches} matches, found HTML for {found_matches} sections")
    
    # Save updated JSON
    print(f"Saving results to {args.output_file}")
    with open(args.output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


if __name__ == '__main__':
    main()
