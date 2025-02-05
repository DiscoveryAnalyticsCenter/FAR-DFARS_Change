import DefaultLayout from "@/layouts/default";
import {Input} from "@heroui/input"
import {Divider} from "@heroui/divider";
import {Button, ButtonGroup} from "@heroui/button"
import { SearchIcon } from "../components/icons";
import { useState } from "react";
import {Listbox, ListboxItem} from "@heroui/listbox"
import { Proposal, ProposedRuleChange } from "../types";
import {Progress} from "@heroui/progress"
import { ThemeSwitch } from "@/components/theme-switch";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner"

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
  const [titleViewEnabled, setTitleViewEnabled] = useState<boolean>(true);
  const [proposalPageLoading, setProposalPageLoading] = useState<boolean>(false);

  let lastPageLoaded: number = 1;

  async function fetchProposal(id: string, title: string) {
    setSelectedProposal("loading")
    setSelectedProposalTitle(title)
    const res = await fetch(`/api/proposals/${id}`)
    const proposal = await res.json();
    setSelectedProposal(proposal)
  }
  
  function cleanTitle(title: string) {
    return title.replace(/Federal Acquisition Regulations?:[:;]?\s?|FAR Case \d{4}-\d{3}[,;]?\s?/g, '').trim();
  }

  async function fetchProposals(page: number) {
    const proposals = fetch(`/api/proposals?page=${page}`)
  }
  
  return (
    <DefaultLayout>
      <div className="grid grid-cols-[auto_auto_1fr] h-full pb-[64px]">
        <div id="search-column" className="flex flex-col h-full w-fit mr-5">
          <div className="flex mb-5 px-[12px]">
            <Input className="mr-2 " placeholder="Search"/>
            <Button isIconOnly>
              <SearchIcon/>
            </Button>
          </div>
          <div className="flex !justify-start !items-center px-[12px] mb-5">
            <span className="mr-5">View Proposal Titles</span>
            <Switch defaultSelected onValueChange={(value) => setTitleViewEnabled(value)}/>
          </div>
          <Listbox >
            <>
              {
                proposedRuleChanges.map((proposal: ProposedRuleChange) => 
                  <ListboxItem className="max-w-[262px]" onPress={(e) => fetchProposal(proposal.id, proposal.attributes.title)}>
                    {
                      titleViewEnabled ? cleanTitle(proposal.attributes.title) : proposal.id
                    }
                  </ListboxItem>
                  
                )
              }
              {
                proposalPageLoading ?
                <ListboxItem isReadOnly><i>Load More</i></ListboxItem> :      
                <ListboxItem isDisabled><Spinner/></ListboxItem>
              }
            </>     
          </Listbox>
        </div>
        <div>
        <Divider orientation="vertical"/>
        </div>
        <div>
          {
            !selectedProposal &&
            <div className="w-full h-full flex justify-center items-center opacity-50">
              Select a Proposal
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
