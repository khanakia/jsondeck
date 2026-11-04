# Security policy

## Supported versions

Only the latest release gets security fixes. jsondeck is loaded by pinned version tag, so moving to a fixed version means changing the tag in your page.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately instead:

- through GitHub's private vulnerability reporting: the repository's **Security** tab → **Report a vulnerability**, or
- by email to khanakia@gmail.com with "jsondeck security" in the subject.

Include the version, a small page or config that shows the problem and what an attacker could do with it. You will get a reply within 7 days. Once a fix is released, the report is credited in the changelog unless you ask otherwise.

## Scope

jsondeck renders data it is given. The parts most likely to matter are cell renderers, the Markdown widget (which builds React elements and never inserts raw HTML), links built from data and anything copied to the clipboard. jsondeck makes no network calls; a report showing that it does is in scope.
