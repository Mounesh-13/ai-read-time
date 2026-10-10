# Publishing checklist

This repo is build-ready, but it is not published from the sandbox. Before the first public release:

1. Create an empty GitHub repository `ai-read-time` under `Mounesh-13` (if not already created).
2. Done: repository path is `Mounesh-13/ai-read-time` in `src/shared/constants.ts` and `.github/ISSUE_TEMPLATE/config.yml`. For a Firefox Add-ons submission, replace the sample Gecko ID `ai-read-time@example.org` in `wxt.config.ts` with an ID you control/that is unique to your listing.
3. Enable GitHub's private vulnerability reporting in the new repository's security settings.
4. Complete the live-site selector and manual QA checks in [TESTING.md](TESTING.md). Current site selectors are unverified and can break as those sites change.
5. From the project folder, authenticate to GitHub on your own machine, then push the source:

   ```sh
   git init
   git add .
   git commit -m "feat: initial AI read-time extension"
   git branch -M main
   git remote add origin https://github.com/OWNER/REPOSITORY.git
   git push -u origin main
   ```

6. After CI passes, create the first release:

   ```sh
   git tag v0.1.0
   git push origin v0.1.0
   ```

   The GitHub Actions release workflow builds and attaches Chrome, Firefox, and source ZIPs. This is the free sideloading route.

7. Store distribution is separate. The Chrome Web Store and Firefox Add-ons require maintainer-owned developer accounts, listings, review, and any store-specific privacy declarations. Store publishing is not automated in this repository.

Never share a GitHub token in chat or commit credentials. Use GitHub CLI or your OS credential manager on the machine that performs the push.
