  import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { useEffect, useState } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextField } from "@mui/material";
import { Progress } from "@heroui/progress";

export default function FARGenerator(props: {isOpen: boolean, onOpenChange: () => void}) {
    const [selectedNDAASection, setSelectedNDAASection] = useState<string | "">("");
    const [selectedYear, setSelectedYear] = useState("")
    const [selectedFARSection, setSelectedFARSection] = useState<string | "">("");
    const [proposalLoading, setProposalLoading] = useState<boolean>(false);
    const [proposal, setProposal] = useState<string>("");
    const [frs, setFRS] = useState<string>("");
    const [showingFRS, setShowingFRS] = useState<boolean>(false);

    useEffect(() => {
      setShowingFRS(false);
      setSelectedNDAASection("");
      setSelectedYear("");
      setSelectedFARSection("");
      setProposalLoading(false);
      setProposal("");
    }, [props.isOpen]);

    async function generateProposal() {
      setProposalLoading(true);
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: {"Content-Type":  "application/json"},
        body: JSON.stringify({
          NDAASection: selectedNDAASection,
          year: selectedYear,
          FARSection: selectedFARSection
        })
      });
      const summaries = await res.json();
      setProposal(summaries.proposal);
      setFRS(summaries.frs);
      setProposalLoading(false);
    }

    function isValidPositiveNumber(input: string) {
      return /^(?:\d+\.?\d*|\.\d+)$/.test(input.trim());    
    }

    function changeSelectedSection(document: "NDAA" | "FAR", section: string) {
      if (section === "") {
        document === "NDAA" ? setSelectedNDAASection("") : setSelectedFARSection("");
        return;
      }
      if (!isValidPositiveNumber(section)) return;
      document === "NDAA" ? setSelectedNDAASection(section) : setSelectedFARSection(section);
    }

    function generateButtonDisabled() {
      const d = new Date();
      const enabled = (selectedNDAASection !== "" && Number(selectedNDAASection) > 0) && (selectedYear && Number(selectedYear) >= 1776 && Number(selectedYear) <= Number(d.getFullYear())) && (selectedFARSection !== "" && Number(selectedFARSection) > 0)
      return !enabled;
    }

    function toggleView() {
      setShowingFRS(!showingFRS);
    }
    
    return (
      <Modal isOpen={props.isOpen} size="5xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Generate FAR Proposal From NDAA Section</ModalHeader>
                <ModalBody>
                  {
                    !proposalLoading && proposal.length == 0 &&
                    <div className="flex justify-evenly">
                      <div className="flex flex-col">
                        <h5 className="mb-2">NDAA Section</h5>
                        <TextField value={selectedNDAASection} variant="outlined" onChange={(e) => changeSelectedSection("NDAA", e.target.value)}/>
                      </div>
                      <div className="flex flex-col">
                        <h5 className="mb-2">Year</h5>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker views={['year']} onChange={(e) => setSelectedYear(e?.$y)}/>
                        </LocalizationProvider>
                      </div>
                      <div className="flex flex-col">
                        <h5 className="mb-2">Corresponding FAR Section</h5>
                        <TextField value={selectedFARSection} variant="outlined" onChange={(e) => changeSelectedSection("FAR", e.target.value)}/>
                      </div>
                    </div>
                  }
                  {
                    proposalLoading &&
                    <div className="flex justify-center">
                      <Progress isIndeterminate label="Generating..." aria-label="Generating..." className="max-w-md mt-5" size="sm" />
                    </div>
                  }
                  {
                    !proposalLoading && proposal.length > 0 && !showingFRS &&
                    <div className="w-full">
                      <div className="w-full overflow-y-scroll pr-5" dangerouslySetInnerHTML={{ __html: proposal.substring(8, proposal.length-3) }} />
                    </div>
                  }
                  {
                    !proposalLoading && proposal.length > 0 && showingFRS &&
                    <div className="w-full">
                      <div className="w-full overflow-y-scroll pr-5" dangerouslySetInnerHTML={{ __html: frs.substring(8, frs.length-3) }} />
                    </div>
                  }
                 
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={props.onOpenChange}>
                    Close
                  </Button>
                  {
                    !proposalLoading && proposal.length == 0 &&
                    <Button color="primary" onPress={generateProposal} isDisabled={generateButtonDisabled()}>
                      Generate
                    </Button>
                  }
                  {
                    !proposalLoading && proposal.length > 0 && 
                    <Button variant="light" onPress={toggleView} disableRipple>
                      { !showingFRS && <> View Federal Register Summary </> }
                      { showingFRS && <> View Proposal </> }
                    </Button>
                  }
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
    );
}
