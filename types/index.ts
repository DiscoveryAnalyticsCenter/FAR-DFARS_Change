import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

type ProposedRuleChangeAttributes = {
  documentType: string,
  lastModifiedDate: string,
  highlightedContent: string,
  frDocNum: string,
  withdrawn: boolean,
  agencyId: string,
  allowLateComments: boolean,
  commentEndDate: string,
  title: string,
  postedDate: string,
  docketId: string,
  subtype: any,
  commentStartDate: string,
  withinCommentPeriod: boolean,
  openForComment: boolean,
  objectId: string
}

type FileFormat = {
  fileUrl: string;
  format: string;
  size: number;
};

type DisplayProperty = {
  name: string;
  label: string;
  tooltip: string;
};

type DocumentAttributes = {
  additionalRins: string[];
  allowLateComments: boolean;
  authorDate: string | null;
  authors: string | null;
  cfrPart: string;
  commentEndDate: string;
  commentStartDate: string;
  effectiveDate: string | null;
  exhibitLocation: string | null;
  exhibitType: string | null;
  frDocNum: string;
  frVolNum: string | null;
  implementationDate: string | null;
  media: string | null;
  ombApproval: string | null;
  paperLength: number;
  paperWidth: number;
  regWriterInstruction: string | null;
  sourceCitation: string | null;
  startEndPage: string;
  subject: string | null;
  topics: string | null;
  address1: string | null;
  address2: string | null;
  agencyId: string;
  city: string | null;
  category: string | null;
  comment: string | null;
  country: string | null;
  displayProperties: DisplayProperty[];
  docAbstract: string | null;
  docketId: string;
  documentType: string;
  email: string | null;
  fax: string | null;
  field1: string | null;
  field2: string | null;
  fileFormats: FileFormat[];
  firstName: string | null;
  govAgency: string | null;
  govAgencyType: string | null;
  objectId: string;
  lastName: string | null;
  legacyId: string | null;
  modifyDate: string;
  organization: string | null;
  originalDocumentId: string;
  pageCount: number;
  phone: string | null;
  postedDate: string;
  postmarkDate: string | null;
  reasonWithdrawn: string | null;
  receiveDate: string;
  restrictReason: string | null;
  restrictReasonType: string | null;
  stateProvinceRegion: string | null;
  submitterRep: string | null;
  submitterRepAddress: string | null;
  submitterRepCityState: string | null;
  subtype: string | null;
  title: string;
  trackingNbr: string | null;
  withdrawn: boolean;
  zip: string | null;
  openForComment: boolean;
  withinCommentPeriod: boolean;
};

type DocumentLinks = {
  self: string;
};

type DocumentRelationships = {
  attachments: {
    links: {
      self: string;
      related: string;
    };
  };
};

export type Proposal = {
  id: string;
  type: string;
  links: DocumentLinks;
  attributes: DocumentAttributes;
  relationships: DocumentRelationships;
};

export type ProposedRuleChangeData = {
  proposals: Proposal[],
  pageNumber: number,
  hasNextPage: boolean,
  hasPrevPage: boolean,
  totalDocuments: number
}