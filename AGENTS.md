# HarflowUI

Read README.md and docs/architecture.md before editing. Preserve layer boundaries and existing work. Target files below 250 substantive lines and functions below 50 code lines; enforced maxima are 400 and 80. Run the documented checks before completion. Delegated workers follow their assigned scope and do not restart orchestration or review loops. Professional artifacts remain neutral.

## Ownership and interfaces

model owns pure client values; application owns constructor-injected ports and use cases; presentation owns framework-independent presenters and immutable state; components owns pure React views; features owns React composition and presenter lifetime. Cross-layer imports must use public index entry points. Keep Electron, Node, transport and persistence adapters outside this package. Read docs/architecture.md for permitted edges.

## Test ownership

When unit tests are needed, the primary delegates them to the dedicated test_writer (gpt-6-luna, medium effort). That worker owns tests/ and coordinates production interfaces with the implementer. Preserve concurrent edits. Delegated workers do not restart the surrounding review workflow.
