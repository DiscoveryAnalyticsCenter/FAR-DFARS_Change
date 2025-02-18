import { ProposedRuleChangeData } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  let prs = await fetch(`https://api.regulations.gov/v4/documents?filter[documentType]=Proposed%20Rule&filter[agencyId]=FAR&page[number]=${req.query.page ? req.query.page : 1}&filter[searchTerm]=${req.query.query}&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  if (prs.status !== 200) {
    res.status(prs.status).json("An unexpected error occurred.")
  }
  const proposalData = await prs.json();
  const out: ProposedRuleChangeData = {
    proposals: proposalData.data,
    pageNumber: proposalData.meta.pageNumber,
    hasNextPage: proposalData.meta.hasNextPage,
    hasPrevPage: proposalData.meta.hasPrevPage,
    totalDocuments: proposalData.meta.totalElements
  }
  res.status(200).json(out);
}
