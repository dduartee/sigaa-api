import { LoginStatus } from '../sigaa-types';

/**
 * The institution serves to adjust interactions with SIGAA.
 * @category Public
 */
export type InstitutionType = 'IFSC' | 'UFPB' | 'IFPR';

/**
 * Sigaa session control
 * @category Internal
 */
export interface Session {
  readonly institution: InstitutionType;
  loginStatus: LoginStatus;
}

/**
 * @category Internal
 */
export class SigaaSession implements Session {
  constructor(public readonly institution: InstitutionType = 'IFSC') {}
  loginStatus: LoginStatus = LoginStatus.Unauthenticated;
}
