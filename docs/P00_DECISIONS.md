# P00 documentation reconciliation

- The phase plan and P00 brief govern MVC folders and package names. The older LLD and component folder examples describe the same responsibilities with different paths. The supplied documentation lives directly in docs.
- The REST specification governs the v1 response envelope. The example flat ApiError from the phase plan is represented as a nested error plus requestId. Health adds GET /api/v1/health and reports process liveness.
- The screen spec governs route paths. The older roadmap asks for populated mock screens. This phase delivers purpose-only placeholders per the P00 brief.
- The database defines issued invoice lifecycle as ISSUED or VOID. PAID is derived status, and LLD's invoice DRAFT is deferred pending an explicit draft contract. For a zero-total issued invoice, the LLD checks zero paid first, yielding UNPAID. This precedence resolves overlapping BR-05 predicates for P00.
- Amounts round once per line to the nearest paise. Half-up is the proposed tie rule for nonnegative amounts, pending review before financial posting goes live.
- Reference screenshots were unavailable in the workspace. The shell uses the written MDR and Screen Spec.
- The phase plan uses DEFAULT_RATE, while the component example uses DEFAULT. Shared contracts use DEFAULT_RATE. For CUSTOM_TOTAL, agreedTotalPaise is the write input and totalPaise is the frozen line amount.
