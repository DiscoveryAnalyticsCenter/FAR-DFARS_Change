import DefaultLayout from "@/layouts/default";
import {Input} from "@heroui/input"
import {Divider} from "@heroui/divider";
import {Button} from "@heroui/button"
import { SearchIcon } from "../components/icons";
import { useState } from "react";
import {Listbox, ListboxItem} from "@heroui/listbox"
import { BasicProposalData, Proposal, ProposedRuleChangeData } from "../types";
import {Progress} from "@heroui/progress"
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner"
import ProposalView from "@/components/proposalView";

export async function getServerSideProps(ctx: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals`);
  const data = await res.json();

  return {
    props: { 
      firstProposalsPage: data
    }
  };
}

let lastPageLoaded: number = 1;

export default function IndexPage(props: {firstProposalsPage: any}) {
  const [selectedProposal, setSelectedProposal] = useState<BasicProposalData | null>(null);
  const [proposedRuleChangeData, setProposedRuleChangeData] = useState<ProposedRuleChangeData>(props.firstProposalsPage)
  const [titleViewEnabled, setTitleViewEnabled] = useState<boolean>(true);
  const [proposalPageLoading, setProposalPageLoading] = useState<boolean>(false);


  async function fetchProposal(id: string, title: string) {
    setSelectedProposal({id, title});
    const res = await fetch(`/api/proposals/${id}`)
    const proposal = await res.json();
    // setSelectedProposal(proposal)
  }
  
  /**
   * Remove boilerplate prefixes from FAR titles.
   * @param title 
   * @returns The cleansed title
   */
  function cleanTitle(title: string) {
    return title.replace(/Federal Acquisition Regulations?:[:;]?\s?|FAR Case \d{4}-\d{3}[,;]?\s?/g, '').trim();
  }

  async function fetchProposalsPage(page: number) {
    setProposalPageLoading(true);
    const res = await fetch(`/api/proposals?page=${page}`);
    let proposalData = await res.json();
    setProposedRuleChangeData({
      ...proposalData,
      proposals: [...proposedRuleChangeData.proposals, ...proposalData.proposals]
    });
    setProposalPageLoading(false);
    lastPageLoaded = page;
  }
  
  return (
    <DefaultLayout>
      <div className="grid grid-cols-[auto_auto_1fr] h-full pb-[64px] max-h-[calc(100vh-32px-64px)]">
        <div id="search-column" className="flex flex-col h-full w-fit mr-5 max-h-[calc(100vh-32px-64px-64px)]">
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
          <div className="flex flex-col max-h-[calc(100%-110px)]">
            <div className="mx-[12px] text-xs mb-2">
              <i>Viewing {proposedRuleChangeData.proposals.length}/{proposedRuleChangeData.totalDocuments}</i>
            </div>
            <Listbox className="max-h-[92%] overflow-y-scroll mb-auto">
              <>
                {
                  proposedRuleChangeData.proposals.map((proposal: Proposal) => 
                    <ListboxItem className="max-w-[262px]" onPress={(e) => fetchProposal(proposal.id, proposal.attributes.title)}>
                      {
                        titleViewEnabled ? cleanTitle(proposal.attributes.title) : proposal.id
                      }
                    </ListboxItem>
                    
                  )
                }
              </>     
            </Listbox>
            {
              !proposalPageLoading ?
              <Button variant="light" color="primary" onPress={() => fetchProposalsPage(lastPageLoaded += 1)}>Load More</Button> :
              <Spinner className="mt-2"/>
            }
          </div>
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
            selectedProposal &&
            // <div className="w-full h-full flex flex-col mx-5">
            //   <div className="text-2xl"><b>{selectedProposal.attributes.title}</b></div>
            // </div>
            <ProposalView basicData={selectedProposal} onProposalLoad={() => console.log()}/>
          }
        </div>
      </div>
    </DefaultLayout>
  );
}
