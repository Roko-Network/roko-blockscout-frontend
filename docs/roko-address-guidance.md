# Guided address tabs

The address page keeps native balance, the full indexed transaction count,
and the recorded balance block visible across tabs. These are observations,
not assertions about spendability, current finality, validator election, or
contract safety. Missing/error/degraded values are not rendered as zero.

Every configured tab has a concise introduction, a suggested first check, and
keyboard-accessible expandable guidance. Existing tab IDs, filters, pagination,
and contract controls remain in place. Visible labels use Overview, Native
calls, Internal activity, and Balance history to reduce unexplained jargon.

pwROKO and Native calls remain discoverable with no indexed history. Their
queries run on tab mount, not on the Overview just to decide tab visibility.
These views show at most 100 recent records; no partial list is advertised as
a lifetime total. Errors and empty results have different explanations and
failed requests offer retry. The pwROKO table names its asset units explicitly.

Validation: TypeScript check, targeted ESLint, five component tests covering
zero/missing/error/degraded balances, base-unit precision, and expandable help.
Desktop browser exercised all eight account tabs; mobile document overflow
check passed. Dark-mode rendering and a browser retry from a simulated 503
to an empty result passed; Overview made no history request. The preview uses public read-only explorer APIs. No wallet was
connected and no transaction was submitted.

This source change has not been deployed to the public explorer. Production
image build and deployment verification remain separate delivery steps.
