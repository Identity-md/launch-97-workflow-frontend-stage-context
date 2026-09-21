# Pledge frontend

The static React application in `web/` uses RainbowKit, wagmi and viem. It loads `imd-deployment.json` relative to the current page and then loads every ABI through that manifest. Contract addresses, the chain ID and ABI locations are not duplicated in source. The only source-level network setting is the public, credential-free Sepolia RPC in `web/src/config.ts`; transaction signing always remains in the visitor's injected browser wallet.

## Build and preview

```sh
cd web
npm ci
npm run typecheck
npm test
npm run build
npx vite preview --outDir ../dist
```

Vite uses `base: './'`, so the committed `dist/` works on an IPFS gateway subpath. A browser wallet such as MetaMask is required. There is deliberately no WalletConnect project ID or secret: the wallet control supports injected EIP-1193 wallets. To change a deployment, replace the runtime manifest and referenced ABI files from a newly attested deployment; do not hard-code addresses in the app.

## Validation evidence

Validated on 2026-09-21:

- `npm run typecheck` completed successfully.
- `npm test` completed successfully (5 tests), covering manifest/ABI runtime loading, unsafe ABI-path rejection, disconnected controls, wrong-chain controls and the explicit approval interaction.
- `npm run build` completed successfully and emitted the relative-base static export.
- The final manifest inventory and SHA-256 values were checked against every exported file, and ABI canonical Keccak hashes were checked against the deployment handoff.
- A local static HTTP smoke check fetched the entrypoint, runtime manifest, referenced ABIs and bundled assets successfully.

No transaction was broadcast and no funded-wallet live interaction was performed. Wallet rejection, wrong-chain switching, pending/confirmed transaction status, approval-before-create, check-in and withdrawal are implemented, but remain dependent on the visitor's wallet and current Sepolia state. Automated browser pixel/layout inspection was not available on this worker; responsive desktop/mobile rules and overflow-safe layouts are included.
