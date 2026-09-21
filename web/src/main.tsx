import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import type { Chain } from 'viem';
import { App } from './App';
import { loadRuntime, PUBLIC_RPC_URL } from './config';
import './style.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<main className="splash">Loading verified deployment…</main>);
loadRuntime().then(runtime => {
  const chain: Chain = {id:runtime.deployment.chainId,name:'Sepolia',nativeCurrency:{name:'Sepolia Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[PUBLIC_RPC_URL]}},blockExplorers:{default:{name:'Etherscan',url:'https://sepolia.etherscan.io'}}};
  const config = createConfig({chains:[chain],connectors:[injected()],transports:{[chain.id]:http(PUBLIC_RPC_URL)}});
  root.render(<React.StrictMode><WagmiProvider config={config}><QueryClientProvider client={new QueryClient()}><RainbowKitProvider theme={darkTheme()}><App runtime={runtime}/></RainbowKitProvider></QueryClientProvider></WagmiProvider></React.StrictMode>);
}).catch(error => root.render(<main className="splash error"><h1>Pledge could not start</h1><p>{error instanceof Error ? error.message : 'Unknown configuration error'}</p><button onClick={()=>location.reload()}>Retry</button></main>));
