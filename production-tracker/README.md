# Production Tracker for Trello — First Working Version

A static, no-build Trello Power-Up. Features:

- Multiple independent production items per card (e.g. ACM #1 and ACM #2).
- Separate checklist and per-item progress bar for every item.
- One total step-count/progress bar directly above the items.
- Power-Up settings to create, edit, duplicate, reorder steps, and delete templates.
- Saves templates to the current Trello board's shared Power-Up data, and items to the current card's shared Power-Up data.
- Editing a template affects NEW items, not previously created items.

## Deployment

1. Upload these files together to your existing GitHub/Netlify project, in their own directory.
2. Deploy with Netlify or another HTTPS static host. Ensure all URLs load without authentication.
3. In https://trello.com/power-ups/admin create a Power-Up owned by the intended workspace. Select "My app will use Power-Up capabilities".
4. Set the **Iframe Connector URL** to the public HTTPS URL of this directory's **index.html**, e.g. `https://your-site.netlify.app/production-tracker/index.html`.
5. In **Capabilities**, enable **Card Back Section** and **Show Settings**; save.
6. Enable your custom Power-Up on a **test board** in that workspace.
7. Open a card to use Production Items. Open the enabled Power-Up's gear icon to edit Production Templates.

## Current limitations / development scope

- Power-Up data storage is limited to 4,096 characters per card/board shared scope; large orders or many templates will require switching to Trello native checklists or a backend.
- The checkboxes in this version are the Power-Up's own checklists, **not** native Trello checklists.
- Templates are specific to each board in this version; workflow/status sync across multiple boards is **not** yet implemented.
- Shared storage can suffer write conflicts if two people update the same card simultaneously. Before department-wide rollout, implement concurrency-safe persistence (and access controls for template editing).
- This is a first-test implementation, not yet production-hardened. Test on a test board before use with live orders.
