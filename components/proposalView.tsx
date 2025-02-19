import { BasicProposalData, Proposal } from "@/types";
import { Progress } from "@heroui/progress";
import { useEffect, useState } from "react";
import {Accordion,AccordionItem} from "@heroui/accordion"
import { Button } from "@heroui/button";
import {Divider} from "@heroui/divider"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { stripHTML } from "@/lib/utils";

export default function ProposalView(props: {basicData: BasicProposalData}) {
  const [proposal, setProposal] = useState<Proposal | null>(null) 
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommentGroupIndex, setSelectedCommentGroupIndex] = useState<number>(-1);
  const [mainSummary, setMainSummary] = useState<string>();

  useEffect(() => {
    async function fetchProposal() {
      let res = await fetch(`/api/proposals/${props.basicData.id}`)
      const propos = await res.json();
      let summaries: string[] = [];
      console.log(propos)
      propos.comments.forEach((commentGroup: any) => {
        summaries.push(commentGroup.summary);
      });
      res = await fetch("/api/proposals/summarizeComments", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'  // ✅ Must be application/json
        },
        body: JSON.stringify({summaries: summaries})
      });
      const summary = await res.json();
      setMainSummary(summary);
      setProposal(propos);
    }
    
    fetchProposal();
  }, [props.basicData]);

  function openCommentsModal(index: number) {
    setSelectedCommentGroupIndex(index);
    setModalOpen(true);
  }

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
      <Modal isOpen={modalOpen} size="5xl" onClose={() => setModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">All Comments in Comment Group {selectedCommentGroupIndex + 1}: {proposal.comments[selectedCommentGroupIndex].title} </ModalHeader>
              <ModalBody>
                {
                  proposal.comments[selectedCommentGroupIndex].comments.map((comment: string, index: number) => 
                    <>
                      <p className="my-3">{comment}</p>
                      {
                        index < proposal.comments[selectedCommentGroupIndex].comments.length - 1 &&
                        <Divider/>
                      }
                    </>
                  )                  
                }
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="text-2xl mb-5">{proposal.attributes.title}</div>

      <Accordion variant="shadow" className="mb-5" defaultExpandedKeys={["sole"]}>
        <AccordionItem title="Comment Summary" key="sole">
          <p className="mb-3">{mainSummary}</p>
          {/* <Divider className="my-3"/>
          <div>Revision Suggestions:</div> */}
        </AccordionItem>
      </Accordion>
      {
        proposal.numComments > 5 &&
        <Accordion variant="splitted" className="!px-0 max-h-[72vh] !pr-2">
        {
          proposal.comments!.map((group: any, index: number) =>
            <AccordionItem title={`Comment Group ${index+1}: ${group.title}`} className="flex flex-col">
              <div>Content Summary:</div>
              <br/>
              <div className="mb-3">{stripHTML(group.summary)}</div>
              {
                group.revisionSuggestion.length > 0 &&
                <>
                  <Divider className="mb-3"/>
                  <div>Revision Suggestions:</div>
                  <br/>
                  <div className="mb-3">{group.revisionSuggestion}</div>
                </>
              }
              <div className="flex justify-end">
                <Button variant="ghost" onPress={() => openCommentsModal(index)}>View All Comments</Button>
              </div>
            </AccordionItem>
          )
        }
      </Accordion>
      }
      {
        proposal.numComments <= 5 &&
        proposal.comments!.map((group: any, index: number) =>
          <Card className="mb-3">
            <CardHeader className="flex gap-3">
              <div className="flex flex-col">
                <p className="text-md">Comment {index + 1}</p>
              </div>
            </CardHeader>
            <CardBody>
              <p>{stripHTML(group.comments)}</p>
              {
                group.revisionSuggestion.length > 0 &&
                <>
                  <Divider className="my-3"/>
                  <div>Revision Suggestions:</div>
                  <br className="mb-3"/>
                  <div className="mb-3">{group.revisionSuggestion}</div>
                </>
              }
            </CardBody>
          </Card>
        )
      }
    </div>
  );
}