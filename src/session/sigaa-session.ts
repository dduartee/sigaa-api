import { LoginStatus } from '../sigaa-types';
import { InstitutionType } from './sigaa-institution-controller';

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
  constructor(public readonly institution: InstitutionType) {}
  loginStatus: LoginStatus = LoginStatus.Unauthenticated;
}
