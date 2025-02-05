import DefaultLayout from "@/layouts/default";
import {Input} from "@heroui/input"
import {Divider} from "@heroui/divider";
import {Button} from "@heroui/button"
import { SearchIcon } from "../components/icons";
import { useState } from "react";
import {Listbox, ListboxItem} from "@heroui/listbox"
import { Proposal, ProposedRuleChange } from "../types";
import {Progress} from "@heroui/progress"
import { ThemeSwitch } from "@/components/theme-switch";

export async function getServerSideProps(ctx: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals`);
  const data = await res.json();

  return {
    props: { 
      firstProposalsPage: data
    }
  };
}

export default function IndexPage(props: {firstProposalsPage: any}) {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | "loading" | null>(null);
  const [proposedRuleChanges, setProposedRuleChanges] = useState<ProposedRuleChange[]>(props.firstProposalsPage.proposals)
  const [selectedProposalTitle, setSelectedProposalTitle] = useState<string | null>(null)

  async function fetchProposal(id: string, title: string) {
    setSelectedProposal("loading")
    setSelectedProposalTitle(title)
    const res = await fetch(`/api/proposals/${id}`)
    const proposal = await res.json();
    setSelectedProposal(proposal)
  }
  
  return (
    <DefaultLayout>
      <div className="grid grid-cols-[auto_auto_1fr] h-full pb-[64px]">
        <div id="search-column" className="flex flex-col h-full w-fit mr-5">
          <div className="flex mb-5">
            <Input className="mr-2 " placeholder="Search"/>
            <Button isIconOnly>
              <SearchIcon/>
            </Button>
          </div>
          <Listbox>
            {
              proposedRuleChanges.map((proposal: ProposedRuleChange) => 
                <ListboxItem className="max-w-[262px]" onPress={(e) => fetchProposal(proposal.id, proposal.attributes.title)}>
                  {proposal.attributes.title}
                </ListboxItem>
              )
            }
          </Listbox>
        </div>
        <div>
        <Divider orientation="vertical"/>
        </div>
        <div>
          {
            !selectedProposal &&
            <div className="w-full h-full flex justify-center items-center">
              dfsgdf
            </div>
          }
          {
            selectedProposal === "loading" &&
            <div className="w-full h-full flex flex-col justify-center items-center">
              <div>{selectedProposalTitle}</div>
              <Progress isIndeterminate aria-label="Loading..." className="max-w-md mt-5" size="sm" />
            </div>
          }
          {
            selectedProposal && selectedProposal !== "loading" &&
            <div className="w-full h-full flex flex-col mx-5">
              <div className="text-2xl"><b>{selectedProposal.attributes.title}</b></div>
            </div>
          }
        </div>
      </div>
    </DefaultLayout>
  );
}
