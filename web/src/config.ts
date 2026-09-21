import type { Abi, Address } from 'viem';

export const PUBLIC_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';
export type Deployment = {version:1;launchId:string;chainId:number;sourceCommit:string;attestationHash:string;contracts:{name:string;address:Address;abiHash:string;abiPath:string}[];assets:{path:string;sha256:string}[]};
export type Runtime = {deployment:Deployment; contracts:Record<string,{address:Address;abi:Abi}>};

export async function loadRuntime(fetcher: typeof fetch = fetch): Promise<Runtime> {
  const base = new URL('.', window.location.href);
  const response = await fetcher(new URL('imd-deployment.json', base));
  if (!response.ok) throw new Error(`Deployment configuration failed (${response.status})`);
  const deployment = await response.json() as Deployment;
  if (deployment.version !== 1 || !deployment.chainId || !deployment.contracts.length) throw new Error('Invalid deployment configuration');
  const entries = await Promise.all(deployment.contracts.map(async contract => {
    if (contract.abiPath.includes('..') || /^\w+:/.test(contract.abiPath)) throw new Error('Unsafe ABI path');
    const abiResponse = await fetcher(new URL(contract.abiPath, base));
    if (!abiResponse.ok) throw new Error(`${contract.name} ABI failed (${abiResponse.status})`);
    return [contract.name,{address:contract.address,abi:await abiResponse.json() as Abi}] as const;
  }));
  return {deployment,contracts:Object.fromEntries(entries)};
}
