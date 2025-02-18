from dotenv import load_dotenv
import os
import requests
import json
from utils import strip_html_tags
from progress.bar import Bar
import time

load_dotenv("../.env")
REGULATIONS_GOV_API_KEY = os.getenv("REGULATIONS_GOV_API_KEY")
DOCUMENT_BAN_LIST = []
with open("banned_documents.txt", "r") as f:
  DOCUMENT_BAN_LIST = [line.rstrip('\n') for line in f]

def fetch_all_far_comments():
  global REGULATIONS_GOV_API_KEY
  global DOCUMENT_BAN_LIST

  page = 1
  last_page = False
  res = requests.get(f"https://api.regulations.gov/v4/comments?filter[agencyId]=FAR&page[size]=250&page[number]={page}&api_key={REGULATIONS_GOV_API_KEY}")

  comments_json = json.loads(res.content)
  comments_metadata_json = comments_json["meta"]
  bar = Bar("Fetching Comments", max=comments_metadata_json["totalElements"])
  success = True
  print(DOCUMENT_BAN_LIST)
  banned_doc_f = open("banned_documents.txt", "a")
  last_comment = ""
  with open("comments.txt", "w+") as f:
    pass
  while not last_page:
    if not banned_doc_f:
      banned_doc_f = open("banned_documents.txt", "a")
    try:
      res = requests.get(f"https://api.regulations.gov/v4/comments?filter[agencyId]=FAR&page[size]=250&page[number]={page}&api_key={REGULATIONS_GOV_API_KEY}")
      comments_json = json.loads(res.content)
      comments_data_json = comments_json["data"]
      comments_metadata_json = comments_json["meta"]
      for comment in comments_data_json:
        parent_document_id = comment["id"][:-5].rstrip("-")
        if parent_document_id in DOCUMENT_BAN_LIST:
          bar.next()
          continue

        res = requests.get(f"https://api.regulations.gov/v4/comments/{comment["id"]}?api_key={REGULATIONS_GOV_API_KEY}")
        c_data_json = json.loads(res.content)["data"]
        clean_comment = strip_html_tags(c_data_json["attributes"]["comment"])

        if last_comment[:40] == clean_comment[:40]:
          banned_doc_f.write(f"{parent_document_id}\n")
        last_comment = clean_comment
        with open("comments.txt", "a+") as f:
          f.write(f"{clean_comment}")
        bar.next()
      page += 1
      last_page = comments_metadata_json["lastPage"]
    except Exception as e:
      banned_doc_f.close()
      banned_doc_f = None
      print()
      if success:
        print(f"Rate Limit Exceeded, Last Page Loaded: ({page}) waiting 1 minute...")
        time.sleep(60)
      else:
        print(f"Hourly Rate Limit Exceeded, Last Page Loaded: ({page}) waiting 1 hour...")
        time.sleep(60*60)
      success = False
  f.close()
fetch_all_far_comments()