import { SWAP_ABI, FACTORY_ABI, FACTORY_ADDRESS, POOL_ABI} from "./constants";
import {
  ethers,
  Finding,
  getJsonRpcUrl,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";

const blockprovider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
const uniPool = async( DerivedPoolAddress: string) => {
  const searchPool = new ethers.Contract(DerivedPoolAddress, POOL_ABI, blockprovider);
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, blockprovider);

  let tokenOne = await searchPool.token0();
  let tokenTwo = await searchPool.token1();
  let fee = await searchPool.fee();

  let fetchPoolAddress = await factory.getPool(tokenOne, tokenTwo, fee);
  if(DerivedPoolAddress.toLocaleLowerCase() == fetchPoolAddress.toLocaleLowerCase()) return true;
  else false;
};


const v3Handler: HandleTransaction = async (txEvent: TransactionEvent) => {
  let findingCount = 0;
  const findings: Finding[] = [];
  const swapEvent = txEvent.filterLog(SWAP_ABI, POOL_ABI);
  // const tradeFee = txEvent.filterLog(POOL_ABI)


  for (const eachSwap of swapEvent) {
  
    const {amount0, amount1} = eachSwap.args;
    const getPool = await uniPool(eachSwap.address);
    if (getPool == true) {
      findings.push(
        Finding.fromObject({
          name: "Uniswap v3 bot agent",
          description: `Detect all eachSwap on v3`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            amount0,
            amount1,
          },
        })
      );
    }
    findingCount++;
  }

  return findings;
};

export default {
  handleTransaction: v3Handler,
};


