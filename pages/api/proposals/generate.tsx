// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { generateProposal } from "@/lib/llm";

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  const proposal = await generateProposal(req.body.NDAASection, req.body.year, req.body.selectedFARSection);
  res.status(200).json(proposal);
}
