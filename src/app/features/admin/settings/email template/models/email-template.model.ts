export interface EmailNotificationInterpolationKeywordModel {
  emailNotificationInterpolationKeywordId: number;
  keyword: string;
  keywordType: string;
  description: string | null;
}

export interface EmailNotificationTemplateResponse {
  emailNotificationTemplateId: number;
  templateCode: string;
  templateName: string;
  subjectTemplate: string;
  bodyTemplate: string;
  recipientTo: string;
  recipientCc: string | null;
  isActive: boolean;
}

export interface EmailNotificationTemplateSaveRequest {
  emailNotificationTemplateId: number;
  templateCode: string;
  templateName: string;
  subjectTemplate: string;
  bodyTemplate: string;
  recipientTo: string;
  recipientCc: string | null;
  isActive: boolean;
  updatedBy: string;
}
