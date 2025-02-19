// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { summarizeOverall } from "@/lib/llm";

export default async function Handler(req: NextApiRequest, res: NextApiResponse) {
  const summary = await summarizeOverall(req.body.summaries);
  res.status(200).json(summary);
}
