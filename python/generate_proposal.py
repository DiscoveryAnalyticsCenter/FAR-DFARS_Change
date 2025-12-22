from typing import Dict
import os
import argparse
from openai import AzureOpenAI


# OpenAI API configuration
OPENAI_MODEL = "gpt-4o-mini"
TEMPERATURE = 0.7

_client = None

def load_client():
    global _client
    if _client is None:
        print("Initializing Azure OpenAI client...")
        api_key = os.getenv('OPENAI_API_KEY')
        _client = AzureOpenAI(
            api_version="2024-12-01-preview",
            azure_endpoint="https://dfars-openai.openai.azure.com/",
            api_key=api_key,
        )
        print("✅ Azure OpenAI client initialized")
    return _client


def generate_proposal(ndaa_section: str, ndaa_text: str, year: str, far_section: str, far_text: str) -> Dict[str, str]:
    """
    Generate a proposal revision and Federal Register summary based on NDAA section and FAR section
    
    Args:
        ndaa_section: The National Defense Authorization Act section number
        year: The fiscal year for the NDAA
        far_section: The Defense Federal Acquisition Regulation Supplement section number
        
    Returns:
        Dictionary with 'proposal' and 'frs' keys containing the generated content
        
    Raises:
        Exception: If API request fails
    """
    print(f"Generating proposal for NDAA Section {ndaa_section} (FY {year}) -> DFARS Section {far_section}...")
    client = load_client()
    
    prompt = f"""Take the text from the National Defense Authorization Act for Fiscal Year {year} section {ndaa_section} (which I will provide below) and revise the Defense Federal Acquisition Regulation Supplement section {far_section} (also provided below).
          Maintain the same DFARS clause number and add or update sub clause numbers as necessary.
          Maintain the same DFARS clause title.
          Clarify under which conditions the clause applies, including specific contract types, dollar thresholds, or contractor classifications. These are not section headings nor sections, but necessary components.
          Maintain and amend the requirements from the current DFARS clause. Include contractor responsibilities, compliance measures, reporting requirements, and procedures.
          Maintain references to other relevant FAR, DFARS, or government regulations and add any new references needed as a result of the NDAA text.
          If and only if there are any flow-down provisions that specify when the clause must be included in subcontracts and, if so, under what conditions include or add them. 
          Format your response in HTML. Please ONLY include the contents of the proposed rule and NOTHING more in your response.
          Additionally please format break up sections using HTML tags. (such as <br>). Furthermore please include bolded, larger font section and subsection headings in your response.
          For section headings, please only use "scope", "definitions", "restrictions" as section headings, as well as an overall heading with the clause number and title\n\n"""

    prompt += "Here is the text of National Defense Authorization Act section {}: {}\n\n".format(ndaa_section, ndaa_text)
    prompt += "And here is the text of Defense Federal Acquisition Regulation Supplement section {}: {}".format(far_section, far_text)

    # First API call: Generate the proposal
    print("Making API call to generate proposal...")
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=TEMPERATURE
        )
        proposal = response.choices[0].message.content
        print(f"✅ Proposal generated successfully ({len(proposal)} characters)")
    except Exception as e:
        print(f"❌ Error generating proposal: {str(e)}")
        raise Exception(f"OpenAI API request failed when generating proposal: {str(e)}")

    # Second API call: Generate Federal Register summary
    print("Making API call to generate Federal Register summary...")
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                },
                {
                    "role": "assistant",
                    "content": proposal
                },
                {
                    "role": "user",
                    "content": """Please provide a summary of the change, background of the change, 
          discussion and analysis of the change and expected impacts of the change to be published in the Federal Register. 
          Format your response in HTML. Please ONLY include the contents of the summary, background, and analysis and NOTHING more in your response, which means no preface or header.
          Do not include anything at the begimning of the text which is simialar to "Summary of the change"
          Additionally please format break up sections using HTML tags. (such as <br>)"""
                }
            ],
            temperature=TEMPERATURE
        )
        frs = response.choices[0].message.content
        print(f"✅ Federal Register summary generated successfully ({len(frs)} characters)")
    except Exception as e:
        print(f"❌ Error generating Federal Register summary: {str(e)}")
        raise Exception(f"OpenAI API request failed when generating Federal Register summary: {str(e)}")

    # if proposal starts with ```html, remove it
    if proposal.startswith('```html'):
        proposal = proposal[len('```html'):]
    # if proposal ends with ```, remove it
    if proposal.endswith('```'):
        proposal = proposal[:-len('```')]

    # if frs starts with ```html, remove it
    if frs.startswith('```html'):
        frs = frs[len('```html'):]
    # if frs ends with ```, remove it
    if frs.endswith('```'):
        frs = frs[:-len('```')]

    return {
        "proposal": proposal,
        "frs": frs
    }


def main(ndaa_section: str, year: str, far_section: str, output_file: str = None):
    """
    Main function to generate proposal and optionally save to file
    
    Args:
        ndaa_section: The National Defense Authorization Act section number
        year: The fiscal year for the NDAA
        far_section: The Defense Federal Acquisition Regulation Supplement section number
        output_file: Optional path to save the output JSON file
    """
    try:
        result = generate_proposal(ndaa_section, year, far_section)
        print("✅ Proposal generation completed successfully")
        
        if output_file:
            import json
            print(f"Saving results to {output_file}...")
            with open(output_file, "w") as f:
                json.dump(result, f, indent=2)
            print(f"✅ Proposal data saved to {output_file}")
        else:
            import json
            print("\n--- Generated Proposal Output ---")
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a DFARS proposal revision and Federal Register summary based on NDAA section"
    )
    parser.add_argument("ndaa_section", type=str, help="The National Defense Authorization Act section number")
    parser.add_argument("year", type=str, help="The fiscal year for the NDAA")
    parser.add_argument("far_section", type=str, help="The Defense Federal Acquisition Regulation Supplement section number")
    parser.add_argument("--output", "-o", type=str, help="Optional path to save the output JSON file")
    
    args = parser.parse_args()
    main(args.ndaa_section, args.year, args.far_section, args.output)

