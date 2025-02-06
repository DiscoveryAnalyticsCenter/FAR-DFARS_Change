from dotenv import load_dotenv
import os
import requests
import json
from utils import strip_html_tags
from progress.bar import Bar
import time

load_dotenv("../.env")
REGULATIONS_GOV_API_KEY = os.getenv("REGULATIONS_GOV_API_KEY")

def fetch_all_far_comments():
  global REGULATIONS_GOV_API_KEY
  page = 1
  last_page = False
  # while not last_page:
  res = requests.get(f"https://api.regulations.gov/v4/comments?filter[agencyId]=FAR&page[size]=250&page[number]={page}&api_key={REGULATIONS_GOV_API_KEY}")


  comments_json = json.loads(res.content)
  comments_metadata_json = comments_json["meta"]
  bar = Bar("Fetching Comments", max=comments_metadata_json["totalElements"])
  success = True
  while not last_page:
    try:
      res = requests.get(f"https://api.regulations.gov/v4/comments?filter[agencyId]=FAR&page[size]=250&page[number]={page}&api_key={REGULATIONS_GOV_API_KEY}")
      comments_json = json.loads(res.content)
      comments_data_json = comments_json["data"]
      comments_metadata_json = comments_json["meta"]
      with open("comments.txt", "w+") as f:
        pass
      for comment in comments_data_json:
        res = requests.get(f"https://api.regulations.gov/v4/comments/{comment["id"]}?api_key={REGULATIONS_GOV_API_KEY}")
        c_data_json = json.loads(res.content)["data"]
        clean_comment = strip_html_tags(c_data_json["attributes"]["comment"])

        with open("comments.txt", "a+") as f:
          f.write(f"{clean_comment}")
        bar.next()
      page += 1
      last_page = comments_metadata_json["lastPage"]
    except:
      print()
      if success:
        print(f"Rate Limit Exceeded, Last Page Loaded: ({page}) waiting 1 minute...")
        time.sleep(60)
      else:
        print(f"Hourly Rate Limit Exceeded, Last Page Loaded: ({page}) waiting 1 hour...")
        time.sleep(60*60)
      success = False
fetch_all_far_comments()