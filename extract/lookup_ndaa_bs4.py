import argparse
import json
import re
from bs4 import BeautifulSoup
import textdistance
from lxml import etree
import os

def disambiguate_sections(sections, title):
    if not title:
        return sections[0]
    scores = {}
    for i, section in enumerate(sections):
        # USLM uses "heading", Senate uses "header"
        heading_tag = section.find("heading") or section.find("header")
        if heading_tag is not None and heading_tag.text:
            # compute edit distance between the heading and the title
            scores[i] = textdistance.hamming.distance(heading_tag.text.strip(), title)

    if not scores:
        return sections[0]
    best_key = min(scores, key=scores.get)
    return sections[best_key]

def lookup_section(soup, number, title, senate=False, xslt_path=None):
    """
    Find all sections that contain a num tag (or enum tag when senate=True) with the specified value.
    
    Args:
        soup (BeautifulSoup): BeautifulSoup object containing the parsed XML
        number (str or int): The section number to search for (e.g., "211" or 211)
        title (str): Section title for disambiguation when multiple matches exist
        senate (bool): If True, look for enum tag containing integer instead of num tag
        xslt_path (str, optional): Path to XSLT stylesheet for HTML conversion
    
    Returns:
        str: HTML string of the matching section, or None if not found
    """
    # Convert number to string for consistent comparison
    number_str = str(number)
    
    # Find all section elements
    sections = soup.find_all('section')
    
    matching_sections = []
    for section in sections:
        if senate:
            # Senate format: enum tag contains the number as text (e.g., "211.")
            enum_tag = section.find('enum')
            if enum_tag is not None:
                enum_text = (enum_tag.get_text() or '').strip().rstrip('.')
                if enum_text == number_str:
                    matching_sections.append(section)
        else:
            # House/USLM format: num tag with value attribute
            num_tag = section.find('num', {'value': number_str})
            if num_tag is not None:
                matching_sections.append(section)
    
    if len(matching_sections) > 1:
        section = disambiguate_sections(matching_sections, title)
    elif len(matching_sections) == 1:
        section = matching_sections[0]
    else:
        return None

    return xml_to_html(section, xslt_path)


def extract_section_number_and_title(ndaa_header):
    """
    Extract section number and title from ndaa_header string.
    
    Args:
        ndaa_header (str): Header string like "211. MODIFICATION OF COOPERATIVE RESEARCH AND 4  DEVELOPMENT PROJECT AUTHORITY. 5"
    
    Returns:
        tuple: (section_number, title)
    """
    # Split on first space to separate number from title
    ndaa_str = (ndaa_header if isinstance(ndaa_header, str) else str(ndaa_header)).strip()
    parts = ndaa_str.split(' ', 1)
    if len(parts) >= 2:
        section_number = parts[0].rstrip('.')
        title = parts[1].strip()
        # Remove trailing numbers that might be page numbers
        title = re.sub(r'\s+\d+\s*$', '', title)
        return section_number, title
    # Before giving up, check if ndaa_header is just an integer (e.g. "411" or 411)
    if ndaa_str and ndaa_str.rstrip('.').isdigit():
        return ndaa_str.rstrip('.'), ""
    return None, None


# Cache of XSLT transformers by path (allows both USLM and Senate stylesheets)
_xslt_transformers = {}

def get_xslt_transformer(xslt_path=None):
    """
    Get or create the XSLT transformer. Loads the XSLT stylesheet if not already loaded.
    
    Args:
        xslt_path (str, optional): Path to XSLT stylesheet. If None, looks for uslm_to_html.xslt
                                   in the same directory as this script.
    
    Returns:
        etree.XSLT: The XSLT transformer object
    """
    global _xslt_transformers
    
    if xslt_path is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        xslt_path = os.path.join(script_dir, 'uslm_to_html.xslt')
    
    if xslt_path not in _xslt_transformers:
        if not os.path.exists(xslt_path):
            raise FileNotFoundError(f"XSLT stylesheet not found: {xslt_path}")
        xslt_doc = etree.parse(xslt_path)
        _xslt_transformers[xslt_path] = etree.XSLT(xslt_doc)
    
    return _xslt_transformers[xslt_path]


def xml_to_html(element, xslt_path=None):
    """
    Convert XML element to HTML format using XSLT transformation.
    Uses the XSD schema location from xsi:schemaLocation if available.
    
    Args:
        element: BeautifulSoup element to convert
        xslt_path (str, optional): Path to XSLT stylesheet. If None, uses default.
    
    Returns:
        str: HTML formatted text
    """
    if element is None:
        return ""
    
    try:
        # Convert BeautifulSoup element to string
        element_str = str(element)
        
        # Parse with lxml (handles namespaces properly)
        # Use recover=True to handle any malformed XML gracefully
        parser = etree.XMLParser(recover=True, huge_tree=True)
        xml_doc = etree.fromstring(element_str.encode('utf-8'), parser)
        
        # Get XSLT transformer
        transformer = get_xslt_transformer(xslt_path)
        
        # Apply transformation
        result_tree = transformer(xml_doc)
        
        # Convert result to string
        html_str = str(result_tree)
        
        return html_str
        
    except etree.XSLTParseError as e:
        print(f"XSLT parsing error: {e}")
        return ""
    except etree.XSLTApplyError as e:
        print(f"XSLT application error: {e}")
        return ""
    except Exception as e:
        print(f"Error converting XML to HTML: {e}")
        return ""


def process_ndaa_matches(xml_file_path, json_file_path, output_file=None, parser_type='bs4', senate=False):
    """
    Process NDAA matches from JSON file and find corresponding sections in XML.
    Adds HTML content to each match and saves updated JSON.
    
    Args:
        xml_file_path (str): Path to the NDAA XML file
        json_file_path (str): Path to the NDAA matches JSON file
        output_file (str, optional): Path to save updated JSON with HTML
        parser_type (str): Parser to use ('bs4' or 'etree')
        senate (bool): If True, use Senate NDAA format (enum tags, senate XSLT)
    """
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"JSON file not found: {json_file_path}")
        return
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file: {e}")
        return
    
    if 'matches' not in data:
        print("No 'matches' key found in JSON file")
        return
    
    print(f"Processing {len(data['matches']["results"])} NDAA sections...")

    with open(xml_file_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f, 'xml')

    # Track statistics
    found_count = 0
    total_count = len(data['matches']["results"])
    
    for i, match in enumerate(data['matches']["results"]):
        if 'ndaa_header' not in match:
            print(f"Warning: No 'ndaa_header' found in match {i}")
            continue
        
        ndaa_header = match['ndaa_header']

        section_number, title = extract_section_number_and_title(ndaa_header)
        
        if not section_number:
            print(f"Warning: Could not extract section number from: {ndaa_header}")
            continue
        
        # print(f"\nLooking for section {section_number}: {title}")

        script_dir = os.path.dirname(os.path.abspath(__file__))
        xslt_path = os.path.join(script_dir, 'senate_to_html.xslt') if senate else None
        matching_section = lookup_section(soup, section_number, title, senate=senate, xslt_path=xslt_path)
        if matching_section is None:
            print(f"Warning: No matching section found for {section_number}: {title}")
            continue
        else:
            found_count += 1
            # print("Matching section\n{}".format(matching_section))
            match["ndaa_html"] = matching_section
            html_soup = BeautifulSoup(matching_section, 'html.parser')
            match["ndaa_title"] = html_soup.find('h2').text.strip()

    print(f"Found {found_count} out of {total_count} sections")
    print(f"Success rate: {(found_count/total_count)*100:.1f}%")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Updated JSON with HTML content saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(
        description='Find matching sections in NDAA XML files and add HTML content to JSON matches',
        epilog='''
Examples:
  python lookup_ndaa.py ndaa.xml ndaaMatches.json
  python lookup_ndaa.py ndaa.xml ndaaMatches.json -o updated_matches.json
  python lookup_ndaa.py /path/to/ndaa.xml /path/to/matches.json --output results.json

The script will:
1. Find matching sections in the NDAA XML file based on section number and title
2. Convert matching sections to HTML format using XSLT transformation
3. Add HTML content and metadata to each match object
4. Save the updated JSON with new fields: html_content, section_id, section_identifier, section_found
        ''',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        'xml_file',
        help='Path to the NDAA XML file'
    )
    parser.add_argument(
        'json_file',
        help='Path to the NDAA matches JSON file'
    )
    parser.add_argument(
        '--output',
        '-o',
        required=True,
        help='Path to save updated JSON file with HTML content'
    )
    parser.add_argument(
        '--senate',
        action='store_true',
        default=False,
        help='Use Senate NDAA format (enum tags instead of num, different XSLT transform)'
    )

    args = parser.parse_args()
    
    process_ndaa_matches(args.xml_file, args.json_file, args.output, senate=args.senate)


if __name__ == '__main__':
    main()