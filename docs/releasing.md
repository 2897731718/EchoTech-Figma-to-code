# Releasing Figma AI Coder

Publish the external package only from the public GitHub repository. The internal source root is a different package with a private registry and must not be used for npmjs publishing.

## First release

Trusted publishing can only be configured after the npm package exists. For the first release:

1. Generate, verify, commit, and push the public snapshot.
2. Confirm the public checkout's `package.json` has the expected `figma-ai-coder` name, version, and exact GitHub `repository.url`.
3. From that public checkout, authenticate an npm account with package-write permission and 2FA, then run `npm publish --access public` once.
4. Do not reuse the internal registry token or copy the internal `.npmrc` into the public checkout.

If `figma-ai-coder` becomes unavailable before the first publish, choose a new public name and update the public package metadata, CLI examples, and Agent templates together. An npm name is not reserved until a successful publish.

## Configure trusted publishing

After the package exists, configure its npm Trusted Publisher with these exact values:

- provider: GitHub Actions
- owner: `2897731718`
- repository: `EchoTech-Figma-to-code`
- workflow filename: `release.yml`
- environment: `npm`
- allowed action: direct `npm publish`

The repository name and workflow filename are case-sensitive. The workflow uses a GitHub-hosted runner, `id-token: write`, Node.js 24, and a current npm CLI. No long-lived npm publish token is required. Complete the first trusted publish within npm's validation window.

See the official [npm Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers/) before changing this workflow.

## Later releases

1. Update `version` in the internal source overlay at `opensource/package.public.json`.
2. Run the internal and generated-public verification suites.
3. Sync and push the public snapshot.
4. Create a GitHub release on the public repository using a tag equal to the package version, for example `v0.1.1`.
5. The `Publish npm package` workflow verifies the tag, rebuilds and retests the package, then publishes through OIDC.

After trusted publishing is proven, npm recommends disabling traditional token-based publishing for the package. Protect the `npm` GitHub Environment and release tags if more maintainers are added.
