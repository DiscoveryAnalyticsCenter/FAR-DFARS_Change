import type { NextApiRequest, NextApiResponse } from "next";

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  let prs = await fetch(`https://api.regulations.gov/v4/documents/${req.query.proposalId}?&api_key=${process.env.REGULATIONS_GOV_API_KEY}`)
  if (prs.status !== 200) {
    res.status(prs.status).json("An unexpected error occurred.")
  }
  const proposalData = await prs.json();
  res.status(200).json(proposalData.data);
}
