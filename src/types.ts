export interface AttachmentData {
  url: string;
  width: number;
  height: number;
}

export interface LetterData {
  kopImage: string | null;
  kopImageHeight: number;
  kopImageFit: 'contain' | 'fill' | 'cover';
  kopImageAlign: 'left' | 'center' | 'right';
  kopImageOffsetY: number;
  kopImageMarginBottom: number;
  kopCompanyName: string;
  letterNumber: string;
  assignerName: string;
  assignerPosition: string;
  assigneeName: string;
  assigneeNIK: string;
  assigneePosition: string;
  clientName: string;
  customerContract: string;
  customerName: string;
  customerAddress: string;
  customerDueDate: string;
  customerInstallment: string;
  customerPenalty: string;
  customerUnpaidInstallmentCount: string;
  attachments: AttachmentData[];
  vehicleBrand: string;
  vehiclePlate: string;
  validFrom: string;
  validTo: string;
  signPlaceDate: string;
}
