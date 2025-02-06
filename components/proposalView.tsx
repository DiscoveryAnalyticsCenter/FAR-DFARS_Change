import { BasicProposalData, Proposal } from "@/types";
import { Progress } from "@heroui/progress";
import { useEffect, useState } from "react";
import {Card, CardBody, CardHeader} from "@heroui/card"
import {Accordion,AccordionItem} from "@heroui/accordion"
import { Button } from "@heroui/button";
import {Divider} from "@heroui/divider"

export default function ProposalView(props: {basicData: BasicProposalData}) {
  const [proposal, setProposal] = useState<Proposal | null>(null) 
  const commentGroups = ["I am group 1", "I am group 2", "I am group 3", "I am group 4", "I am group 5"];

  useEffect(() => {
    async function fetchProposal() {
      const res = await fetch(`/api/proposals/${props.basicData.id}`)
      const propos = await res.json();
      setProposal(propos)
    }
    
    fetchProposal();
  }, [props.basicData]);

  if (!proposal || props.basicData.id !== proposal.id) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
      <div>{props.basicData.title}</div>
      <Progress isIndeterminate aria-label="Loading..." className="max-w-md mt-5" size="sm" />
    </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col mx-5">

      <div className="text-2xl mb-5">{proposal.attributes.title}</div>

      <Accordion variant="shadow" className="mb-" defaultExpandedKeys={["sole"]}>
        <AccordionItem title="Comment Summary" key="sole">
          <div>Content Summary</div>
          <Divider className="my-3"/>
          <div>Revision Suggestions:</div>
        </AccordionItem>
      </Accordion>

      <Accordion variant="splitted" className="!px-0 max-h-[72vh] overflow-y-scroll !pr-2">
        {
          commentGroups.map((group, index: number) =>
            <AccordionItem title={`Comment Group ${index+1}: ${group}`} className="flex flex-col">
              <div>Content Summary</div>
              <Divider className="my-3"/>
              <div>Revision Suggestions:</div>
              <div className="flex justify-end">
                <Button variant="ghost">View All Comments</Button>
              </div>
            </AccordionItem>
          )
        }
      </Accordion>
    </div>
  );
}