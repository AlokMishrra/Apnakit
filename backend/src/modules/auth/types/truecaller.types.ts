export interface TruecallerCallbackDto {
  requestId: string;
  accessToken: string;
  endpoint?: string;
}

export interface TruecallerProfile {
  phoneNumbers?: string[];
  name?: {
    first?: string;
    last?: string;
  };
  avatarUrl?: string;
  onlineIdentities?: {
    email?: string;
  };
  gender?: string;
  aboutMe?: string;
  companyName?: string;
  jobTitle?: string;
}

export interface TruecallerVerificationStatus {
  status: 'pending' | 'completed' | 'rejected' | 'expired';
  user?: any;
  tokens?: any;
  error?: string;
}
