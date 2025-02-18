import { BasicProposalData, Proposal } from "@/types";
import { Progress } from "@heroui/progress";
import { useEffect, useState } from "react";
import {Accordion,AccordionItem} from "@heroui/accordion"
import { Button } from "@heroui/button";
import {Divider} from "@heroui/divider"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

export default function ProposalView(props: {basicData: BasicProposalData}) {
  const [proposal, setProposal] = useState<Proposal | null>(null) 
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCommentGroupIndex, setSelectedCommentGroupIndex] = useState<number>(-1);

  useEffect(() => {
    async function fetchProposal() {
      const res = await fetch(`/api/proposals/${props.basicData.id}`)
      const propos = await res.json();
      setProposal(propos)
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
  console.log(proposal?.comments[selectedCommentGroupIndex]?.comments)
  return (
    <div className="w-full h-full flex flex-col mx-5">
      <Modal isOpen={modalOpen} size="5xl" onClose={() => setModalOpen(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
              <ModalBody>
                {
                  proposal.comments[selectedCommentGroupIndex].comments.map((comment: string, index: number) => 
                    <>
                      <p>{comment}</p>
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
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="text-2xl mb-5">{proposal.attributes.title}</div>

      <Accordion variant="shadow" className="mb-5" defaultExpandedKeys={["sole"]}>
        <AccordionItem title="Comment Summary" key="sole">
          <div>Content Summary</div>
          <Divider className="my-3"/>
          <div>Revision Suggestions:</div>
        </AccordionItem>
      </Accordion>

      <Accordion variant="splitted" className="!px-0 max-h-[72vh] overflow-y-scroll !pr-2">
        {
          proposal.comments!.map((group: any, index: number) =>
            <AccordionItem title={`Comment Group ${index+1}: ${group.title.substring(1, group.title.length-1)}`} className="flex flex-col">
              <div>Content Summary:</div>
              <br/>
              <div className="mb-3">{group.summary}</div>
              {/* <Divider className="my-3"/>
              <div>Revision Suggestions:</div> */}
              <div className="flex justify-end">
                <Button variant="ghost" onPress={() => openCommentsModal(index)}>View All Comments</Button>
              </div>
            </AccordionItem>
          )
        }
      </Accordion>
    </div>
  );
}