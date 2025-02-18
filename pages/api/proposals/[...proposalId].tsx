import type { NextApiRequest, NextApiResponse } from "next";
import { stripHTML } from "@/lib/utils"
import { ProposalComment } from "@/types";
import { clusterComments } from "@/lib/embeddings";
import { summarize } from "@/lib/llm"

async function fetchComment(url: string) {
  const res = await fetch(`${url}?api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  const data = await res.json();
  const message = stripHTML(data.data.attributes.comment);
  return message;
}

async function fetchAllComments(comments: ProposalComment[]) {
  let commentsContent: string[] = [];
  let content;

  for (let i: number = 0; i < comments.length; i++) {
    content = await fetchComment(comments[i].links.self);
    if (content!.length > 0) commentsContent.push(content!);
  }
  return commentsContent;
}

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  let prs = await fetch(`https://api.regulations.gov/v4/documents/${req.query.proposalId}?&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  if (prs.status !== 200) {
    res.status(prs.status).json("An unexpected error occurred fetching the proposal.")
  }
  let commentsRes = await fetch(`https://api.regulations.gov/v4/comments?filter[commentOnId]=0900006480380a6f&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  let comments: string[] = []
  let isLastPage = false;
  while (!isLastPage) {
    commentsRes = await fetch(`https://api.regulations.gov/v4/comments?filter[commentOnId]=0900006480380a6f&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
    let commentData = await commentsRes.json();
    let newComments = await fetchAllComments(commentData.data);
    comments = [...comments, ...newComments]
    isLastPage = commentData.meta.lastPage;
  }
  let groupedComments = await clusterComments(comments);
  let summary;
  let fullComments = []
  let commentData;
  for (let i:number = 0; i < groupedComments.length; i++) {
    summary = await summarize(groupedComments[i]);
    commentData = {
      comments: groupedComments[i],
      summary: summary.summary,
      title: summary.title
    }
    fullComments.push(commentData);    
  }
  const proposalData = {
    ...(await prs.json()).data,
    comments: fullComments
  }
  res.status(200).json(proposalData);
}
