// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Runtime } from './config';

const state=vi.hoisted(()=>({connected:false,chainId:11155111,write:vi.fn()}));
vi.mock('@rainbow-me/rainbowkit',()=>({ConnectButton:()=> <button>Connect wallet</button>}));
vi.mock('wagmi',()=>({
  useAccount:()=>({address:state.connected?'0x1111111111111111111111111111111111111111':undefined,isConnected:state.connected}),
  useChainId:()=>state.chainId,useSwitchChain:()=>({switchChain:vi.fn()}),
  useReadContract:()=>({data:undefined}),useWriteContract:()=>({writeContractAsync:state.write,isPending:false}),
  useWaitForTransactionReceipt:()=>({isSuccess:false,isError:false})
}));
import { App } from './App';

const runtime={deployment:{version:1,launchId:'b307b17c-test',chainId:11155111,sourceCommit:'a',attestationHash:'b',contracts:[],assets:[]},contracts:{Pledge:{address:'0xe2f3b168b54adc238dd62d318a55ddb0c2980868',abi:[]},HabitPledge:{address:'0x82f146e50ca6e334f5d8a2bf462484bba8d51f41',abi:[]}}} as Runtime;
describe('primary actions',()=>{
  afterEach(cleanup);
  beforeEach(()=>{state.connected=false;state.chainId=11155111;state.write.mockReset().mockResolvedValue('0x123')});
  it('keeps transactions disabled while disconnected',()=>{render(<App runtime={runtime}/>);expect(screen.getByRole('button',{name:/approve/i})).toBeDisabled();expect(screen.getByText(/connect a browser wallet/i)).toBeInTheDocument()});
  it('submits explicit approval before pledge creation',async()=>{state.connected=true;render(<App runtime={runtime}/>);fireEvent.change(screen.getByLabelText('Stake'),{target:{value:'10'}});fireEvent.click(screen.getByRole('button',{name:/approve 10 pldg/i}));expect(state.write).toHaveBeenCalledWith(expect.objectContaining({functionName:'approve'}));expect(await screen.findByRole('status')).toHaveTextContent(/approval submitted/i)});
  it('shows a network switch control on the wrong chain',()=>{state.connected=true;state.chainId=1;render(<App runtime={runtime}/>);expect(screen.getByRole('button',{name:/switch to sepolia/i})).toBeInTheDocument();expect(screen.getByRole('button',{name:/check in/i})).toBeDisabled()});
});
