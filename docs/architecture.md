# Architecture

model has no outgoing layer edges. application imports model and declares ports. presentation imports application/model and owns asynchronous state. components imports presentation/model types and renders pure views. features composes these layers and React lifecycle. Cross-layer imports use index entry points. React is a peer dependency. No Electron, Node, network, storage or engine adapter belongs here.

Target files below 250 substantive lines and functions below 50 code lines. Enforced production maxima are 400 and 80. Changes must preserve constructor injection, explicit errors and bounded work. No compatibility or migration claim follows from a successful build.

The source inventory rejects unknown layers, source symlinks and unsupported production file types. Resolved local imports stay inside known src layers; external repository/private source paths cannot relay around layer rules. Unit tests are typechecked and linted with test-only syntax allowances.

Core layers use a no-DOM TypeScript check and prohibit .tsx. HostState belongs to presentation; presenters accept the application HostInformationReader port. Network/storage globals and ordinary member-property access are denied throughout UI, including global-object aliases; this syntax policy does not claim semantic effect analysis of obfuscated computed properties.
