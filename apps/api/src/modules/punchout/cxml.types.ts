/**
 * cXML Punchout type definitions.
 * Ref: cXML User's Guide 1.2.x — PunchOut flow
 *
 * Full implementation in Phase 5b requires:
 *  1. XML parsing (fast-xml-parser or xml2js)
 *  2. Session token generation + validation
 *  3. Redirect URL generation pointing to a hosted catalog page
 *  4. OrderMessage parsing on return to convert cart → requisition lines
 */

export interface CxmlHeader {
  from: { credential: { identity: string } };
  to: { credential: { identity: string } };
  sender: { credential: { identity: string; sharedSecret?: string }; userAgent: string };
}

export interface PunchOutSetupRequest {
  header: CxmlHeader;
  buyerCookie: string;
  /** 'create' | 'inspect' | 'edit' */
  operation: string;
  browserFormPost: { url: string };
  contact?: { name: string; email: string };
  shipTo?: { address: { name: string } };
}

export interface PunchOutSetupResponse {
  status: { code: number; text: string };
  startPage: { url: string };
}

export interface CxmlCartItem {
  lineNumber: number;
  quantity: number;
  unitPrice: number;
  currency: string;
  description: string;
  unitOfMeasure: string;
  supplierPartId?: string;
  supplierPartAuxId?: string;
  manufacturerPartId?: string;
  extrinsic?: Record<string, string>;
}

export interface PunchOutOrderMessage {
  buyerCookie: string;
  punchOutOrderMessageHeader: { operationAllowed: string };
  itemIn: CxmlCartItem[];
}
