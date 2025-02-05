// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  let prs = await fetch(`https://api.regulations.gov/v4/documents?filter[documentType]=Proposed%20Rule&filter[agencyId]=FAR&page[number]=${req.query.page ? req.query.page : 1}&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  if (prs.status !== 200) {
    res.status(prs.status).json("An unexpected error occurred.")
  }
  const prsData = await prs.json();
  const meta = prsData.meta;
  const returnData = {
    proposals: prsData.data,
    totalDocuments: meta.totalElements,
    pageNumber: meta.pageNumber,
    hasNextPage: meta.hasNextPage,
    hasPrevPage: meta.hasPreviousPage
  }
  res.status(200).json(returnData);
}
