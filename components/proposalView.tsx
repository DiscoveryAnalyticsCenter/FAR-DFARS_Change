import { BasicProposalData, Proposal } from "@/types";
import { Progress } from "@heroui/progress";
import { useEffect, useState } from "react";
import {Card} from "@heroui/card"

export default function ProposalView(props: {basicData: BasicProposalData, onProposalLoad: () => void}) {
  const [proposal, setProposal] = useState<Proposal | null>(null) 

  useEffect(() => {
    async function fetchProposal() {
      const res = await fetch(`/api/proposals/${props.basicData.id}`)
      const propos = await res.json();
      setProposal(propos)
    }
    
    fetchProposal();
  }, [props.basicData]);

  if (!proposal) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
      <div>{props.basicData.title}</div>
      <Progress isIndeterminate aria-label="Loading..." className="max-w-md mt-5" size="sm" />
    </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col mx-5">
      <Card
    </div>
  );
}