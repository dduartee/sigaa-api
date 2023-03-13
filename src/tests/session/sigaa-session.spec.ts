import { SigaaSession } from "@session/sigaa-session";
import { LoginStatus } from "src/sigaa-types";

test('if sigaa session is unauthenticated', () => {
  const sigaaSession = new SigaaSession("IFSC");
  expect(sigaaSession.loginStatus).toBe(LoginStatus.Unauthenticated);
});
