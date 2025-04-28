# ADR 1 - Documenting Architectural Decisions

# Status
✅ Accepted on 2025-04-28

# Context
To ensure that significant architectural decisions are clear and accessible to all team members and the public, we need a way to document these design choices effectively.

No one should be left wondering about the thought process behind our architectural decisions. This is essential for both current and future team members, as well as external collaborators who may contribute to the project in the future.

# Decision
We have decided to implement Architecture Decision Records (ADRs) to document significant architectural decisions, including those related to the a11yscore algorithm.

Each ADR will be stored in the `docs/architecture/decisions` directory of this repository. The files will follow a consistent naming convention, with each ADR having a unique and increasing number, starting from 1.

The ADRs will adhere to a standard template consisting of the following sections:

- **Title**: A concise title summarizing the decision.
- **Status**: Current status (e.g., proposed, accepted, deprecated) with the date of any changes made.
- **Context**: Relevant background information and context that is essential for understanding the decision.
- **Decision**: The actual decision made, including consideration of alternative choices.
- **Consequences**: Implications and consequences of the decision, covering potential risks, trade-offs, and what would happen if the decision were not implemented.

Each ADR should be written in Markdown and kept within a maximum length of 1-2 pages.

# Consequences
The introduction of ADRs will provide a structured approach to documenting architectural decisions. This clarity will facilitate understanding among current and future team members, as well as the public, regarding our design choices.

Moreover, this format will make it easier for outside contributors to collaborate with us in the future, allowing them to discuss changes to the architecture using this standardized pattern.
