import { useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { formatUnits, isAddress, parseUnits, type Hash } from 'viem';
import { EXPLORER_URL, type Runtime } from './config';

type Pledge = readonly [string,string,bigint,number,number,boolean,bigint,bigint,string];
const short=(v:string)=>`${v.slice(0,6)}…${v.slice(-4)}`;
const friendly=(e:unknown)=> e instanceof Error ? (e.message.split('\n')[0] || 'Request failed') : 'Request failed';

export function App({runtime}: {runtime:Runtime}) {
  const token=runtime.contracts.Pledge, habit=runtime.contracts.HabitPledge;
  const {address,isConnected}=useAccount(); const chainId=useChainId(); const {switchChain}=useSwitchChain();
  const [goal,setGoal]=useState(''); const [weeks,setWeeks]=useState('4'); const [beneficiary,setBeneficiary]=useState(''); const [stake,setStake]=useState(''); const [pledgeId,setPledgeId]=useState('0');
  const [hash,setHash]=useState<Hash>(); const [status,setStatus]=useState('');
  const wrongChain=isConnected&&chainId!==runtime.deployment.chainId;
  const reads={chainId:runtime.deployment.chainId};
  const balance=useReadContract({...reads,address:token.address,abi:token.abi,functionName:'balanceOf',args:address?[address]:undefined,query:{enabled:!!address}});
  const allowance=useReadContract({...reads,address:token.address,abi:token.abi,functionName:'allowance',args:address?[address,habit.address]:undefined,query:{enabled:!!address}});
  const nextId=useReadContract({...reads,address:habit.address,abi:habit.abi,functionName:'nextPledgeId'});
  const pledge=useReadContract({...reads,address:habit.address,abi:habit.abi,functionName:'getPledge',args:[BigInt(pledgeId||'0')],query:{enabled:/^\d+$/.test(pledgeId)}});
  const week=useReadContract({...reads,address:habit.address,abi:habit.abi,functionName:'currentWeek',args:[BigInt(pledgeId||'0')],query:{enabled:/^\d+$/.test(pledgeId)}});
  const {writeContractAsync,isPending}=useWriteContract(); const receipt=useWaitForTransactionReceipt({hash});
  const stakeWei=useMemo(()=>{try{return parseUnits(stake||'0',18)}catch{return 0n}},[stake]);
  const send=async(label:string, request:Parameters<typeof writeContractAsync>[0])=>{try{setStatus(`Confirm ${label} in your wallet…`);const h=await writeContractAsync(request);setHash(h);setStatus(`${label} submitted`)}catch(e){setStatus(friendly(e))}};
  const canAct=isConnected&&!wrongChain&&!isPending;
  const p=pledge.data as Pledge|undefined; const w=week.data as readonly [number,boolean]|undefined;
  return <div className="page"><header><a className="brand" href="./">PLEDGE<span>.</span></a><ConnectButton accountStatus="address" chainStatus="icon" showBalance={false}/></header>
    <section className="hero"><p className="eyebrow">PLDG · SEPOLIA</p><h1>Show up for the<br/><em>promise you made.</em></h1><p>Stake PLDG behind a weekly habit. Check in each week; missed slices go to your beneficiary.</p></section>
    {wrongChain&&<aside className="warning">Wrong network. <button onClick={()=>switchChain({chainId:runtime.deployment.chainId})}>Switch to Sepolia</button></aside>}
    <main className="grid"><section className="card create"><span className="step">01</span><h2>Make a pledge</h2><label>Goal<input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="Run three mornings a week"/></label><div className="row"><label>Weeks<input type="number" min="1" max="52" value={weeks} onChange={e=>setWeeks(e.target.value)}/></label><label>Stake<input inputMode="decimal" value={stake} onChange={e=>setStake(e.target.value)} placeholder="100 PLDG"/></label></div><label>Beneficiary<input value={beneficiary} onChange={e=>setBeneficiary(e.target.value)} placeholder="0x…"/></label>
      <div className="actions"><button disabled={!canAct||stakeWei<=0n} onClick={()=>send('approval',{address:token.address,abi:token.abi,functionName:'approve',args:[habit.address,stakeWei]})}>1. Approve {stake||'0'} PLDG</button><button className="primary" disabled={!canAct||!goal.trim()||!isAddress(beneficiary)||stakeWei<=0n||Number(weeks)<1||Number(weeks)>52} onClick={()=>send('pledge creation',{address:habit.address,abi:habit.abi,functionName:'createPledge',args:[goal,Number(weeks),beneficiary,stakeWei]})}>2. Create pledge</button></div><small>Approval is a separate transaction. The pledge contract can spend only the amount you approve.</small></section>
      <section className="card"><span className="step">02</span><h2>Track a pledge</h2><label>Pledge ID<input inputMode="numeric" value={pledgeId} onChange={e=>setPledgeId(e.target.value.replace(/\D/g,''))}/></label>{p?<div className="pledge"><h3>{p[8]}</h3><div className="stats"><div><b>{p[4]} / {p[3]}</b><span>check-ins</span></div><div><b>{formatUnits(p[6],18)}</b><span>PLDG staked</span></div></div><p>Pledger <code>{short(p[0])}</code><br/>Beneficiary <code>{short(p[1])}</code></p><p>{p[5]?'Settled':w?.[1]?`Week ${Number(w[0])+1} is open`:'Awaiting or finished'}</p></div>:<p className="muted">Enter an existing ID to load its live onchain state.</p>}
      <div className="actions"><button disabled={!canAct||!p||p[5]||!w?.[1]} onClick={()=>send('check-in',{address:habit.address,abi:habit.abi,functionName:'checkIn',args:[BigInt(pledgeId)]})}>Check in this week</button><button className="primary" disabled={!canAct||!p||p[5]} onClick={()=>send('withdrawal',{address:habit.address,abi:habit.abi,functionName:'withdraw',args:[BigInt(pledgeId)]})}>Settle & withdraw</button></div></section>
      <section className="card account"><span className="step">LIVE</span><h2>Your account</h2>{isConnected?<><p><b>{address&&short(address)}</b></p><dl><dt>PLDG balance</dt><dd>{balance.data!==undefined?formatUnits(balance.data as bigint,18):'Loading…'}</dd><dt>Approved</dt><dd>{allowance.data!==undefined?`${formatUnits(allowance.data as bigint,18)} PLDG`:'Loading…'}</dd><dt>Next pledge ID</dt><dd>{nextId.data?.toString()??'Loading…'}</dd></dl></>:<p className="muted">Connect a browser wallet to read your balance and take action.</p>}<div className="links"><a href={`${EXPLORER_URL}/address/${token.address}`} target="_blank" rel="noreferrer">PLDG contract ↗</a><a href={`${EXPLORER_URL}/address/${habit.address}`} target="_blank" rel="noreferrer">HabitPledge ↗</a></div></section>
    </main>{status&&<div className={`toast ${receipt.isSuccess?'success':''}`} role="status">{receipt.isSuccess?'Transaction confirmed':receipt.isError?'Transaction failed':status}{hash&&<a href={`${EXPLORER_URL}/tx/${hash}`} target="_blank" rel="noreferrer"> View ↗</a>}<button aria-label="Dismiss" onClick={()=>{setStatus('');setHash(undefined)}}>×</button></div>}
    <footer><span>Make it count.</span><small>Deployment {runtime.deployment.launchId.slice(0,8)} · No funds are held by this website.</small></footer></div>;
}
