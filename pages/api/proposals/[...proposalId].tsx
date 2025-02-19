import type { NextApiRequest, NextApiResponse } from "next";
import { stripHTML } from "@/lib/utils"
import { ProposalComment } from "@/types";
import { clusterComments } from "@/lib/embeddings";
import { generateRevision, summarize } from "@/lib/llm"

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

function generateFakeClusters(comments: string[]) {
  let groups: string[][] = [];
  comments.forEach((comment: string) => {
    groups.push([comment]);
  });
  return groups;
}

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  let prs = await fetch(`https://api.regulations.gov/v4/documents/${req.query.proposalId}?&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  if (prs.status !== 200) {
    res.status(prs.status).json("An unexpected error occurred fetching the proposal.")
  }
  const proposal = await prs.json();
  let commentsRes = await fetch(`https://api.regulations.gov/v4/comments?filter[commentOnId]=${proposal.data.attributes.objectId}&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  let comments: string[] = []
  let isLastPage = false;
  while (!isLastPage) {
    commentsRes = await fetch(`https://api.regulations.gov/v4/comments?filter[commentOnId]=${proposal.data.attributes.objectId}&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
    let commentData = await commentsRes.json();
    let newComments = await fetchAllComments(commentData.data);
    comments = [...comments, ...newComments]
    isLastPage = commentData.meta.lastPage;
  }
  let groupedComments: any;
  
  if (comments.length > 5) groupedComments = await clusterComments(comments);
  else groupedComments = generateFakeClusters(comments);

  let summary;
  let fullComments = []
  let commentData;
  let revisionSuggestion: string;

  for (let i:number = 0; i < groupedComments.length; i++) {
    if (comments.length > 5) summary = await summarize(groupedComments[i]);
    else summary = {summary: groupedComments[i][0], title: "Empty"}
    revisionSuggestion = await generateRevision(summary.summary);

    commentData = {
      comments: groupedComments[i],
      summary: summary.summary,
      title: summary.title,
      revisionSuggestion
    }
    fullComments.push(commentData);    
  }
  const proposalData = {
    ...proposal.data,
    numComments: comments.length,
    comments: fullComments
  }
  res.status(200).json(proposalData);
}
