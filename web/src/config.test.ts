// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { loadRuntime } from './config';

describe('runtime deployment loading', () => {
  it('loads addresses and ABIs exclusively from the manifest', async () => {
    const manifest={version:1 as const,launchId:'test',chainId:11155111,sourceCommit:'abc',attestationHash:'def',contracts:[{name:'Pledge',address:'0xe2f3b168b54adc238dd62d318a55ddb0c2980868' as const,abiHash:'hash',abiPath:'abi/Pledge.json'}],assets:[]};
    const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>manifest}).mockResolvedValueOnce({ok:true,json:async()=>[{type:'function',name:'balanceOf'}]});
    const result=await loadRuntime(fetcher as unknown as typeof fetch);
    expect(result.deployment.chainId).toBe(11155111);
    expect(result.contracts.Pledge.address).toBe(manifest.contracts[0].address);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('rejects parent traversal in ABI paths', async () => {
    const bad={version:1,chainId:1,contracts:[{name:'x',address:'0x0',abiPath:'../secret'}]};
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>bad});
    await expect(loadRuntime(fetcher as unknown as typeof fetch)).rejects.toThrow('Unsafe ABI path');
  });
});
