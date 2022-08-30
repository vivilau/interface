import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { RB_POLYGON, RB_POLYGON_MUMBAI } from 'constants/tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useStakingContract } from 'hooks/useContract'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
export const STAKING_GENESIS = 1600387200

export const REWARDS_DURATION_DAYS = 60

export const STAKING_REWARDS_INFO: {
  [chainId: number]: { stakingAddress: string; rewardToken: Token }
} = {
  80001: { stakingAddress: '0xaD1A6452401CD4C4C3439631918C0807BCD36899', rewardToken: RB_POLYGON_MUMBAI },
  137: { stakingAddress: '0x9fA416bf7BAC3D3A3B8c416B7D239e77bcd8fc1b', rewardToken: RB_POLYGON },
}
export interface StakingInfo {
  index: number
  stakeAddress: string
  rewardToken: string
  token0: string
  token1: string
  fee: number
  startTime: BigNumber
  endTime: BigNumber
  numberOfStakes: BigNumber
  totalRewardUnclaimed: BigNumber
  totalSecondsClaimedX128: BigNumber
  minDuration: BigNumber
  outputDaily: BigNumber
}
export interface DepositInfo {
  tokenid: BigNumber
  secondsPerLiquidityInsideInitialX128: BigNumber
  liquidity: BigNumber
  incentiveId: BigNumber
  startTime: BigNumber
  reward: BigNumber
  secondsInsideX128: BigNumber
}
interface StakingResults {
  loading: boolean
  stakingInfo: StakingInfo[] | undefined
}
interface DepositResults {
  loading: boolean
  depositInfo: DepositInfo[] | undefined
}
interface tokensResults {
  loading: boolean
  tokens: BigNumber[]
}

/**
 * @description: get number of deposits
 * @param {*}
 * @return {tokenIds}
 */
export function useTokens(): tokensResults {
  const { account, chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)

  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(tokenContract, 'depositBalance', [
    account ?? undefined,
  ])

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance])

  const tokenIdResults = useSingleContractMultipleData(tokenContract, 'depositOfOwnerByIndex', tokenIdsArgs)
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])
  const someTokenIdserror = useMemo(() => tokenIdResults.some(({ error }) => error), [tokenIdResults])
  const tokenIds = useMemo(() => {
    if (account && !someTokenIdsLoading && !someTokenIdserror) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => BigNumber.from(result[0]))
    }
    return []
  }, [account, someTokenIdsLoading, someTokenIdserror, tokenIdResults])
  return { loading: balanceLoading || someTokenIdsLoading, tokens: tokenIds }
}
export function useIncentiveInfo(index: number): StakingInfo | undefined {
  const { chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)
  const { result } = useSingleCallResult(tokenContract, 'incentiveInfo', [[index]])
  const stakingInfo = useMemo(() => {
    return stakingAdress && result
      ? {
          index,
          stakeAddress: stakingAdress,
          rewardToken: result.rewardToken,
          token0: result.token0,
          token1: result.token1,
          fee: result.fee / 10000,
          startTime: result.startTime,
          endTime: result.endTime,
          numberOfStakes: result.numberOfStakes,
          totalRewardUnclaimed: result.totalRewardUnclaimed,
          totalSecondsClaimedX128: result.totalSecondsClaimedX128,
          minDuration: result.minDuration,
          outputDaily:
            result.totalRewardUnclaimed
              .div(result.endTime.sub(result.startTime.sub(result.totalSecondsClaimedX128.shr(128))))
              .mul(60 * 60 * 24) ?? BigNumber.from(0),
        }
      : undefined
  }, [index, result, stakingAdress])
  return stakingInfo
}
// gets the all the  staking(incentiveInfo) info from the network for the active chain id
export function useStakingInfo(): StakingResults {
  const { chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)

  const { loading: stakeloading, result: numberOfIncentives } = useSingleCallResult(tokenContract, 'numberOfIncentives')
  // we don't expect any account balance to ever exceed the bounds of max safe int
  const incentiveNum: number | undefined = numberOfIncentives?.[0]?.toNumber()
  const arrs = useMemo(() => {
    if (!stakeloading)
      return Array(incentiveNum)
        .fill(null)
        .map((item, index) => [index])
    return []
  }, [incentiveNum, stakeloading])

  const results = useSingleContractMultipleData(tokenContract, 'incentiveInfo', arrs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])
  const incentiveInfos = useMemo(() => {
    if (!loading && !error && stakingAdress) {
      return results.map((call, i) => {
        const result = call.result as CallStateResult
        return {
          index: i,
          stakeAddress: stakingAdress,
          rewardToken: result.rewardToken,
          token0: result.token0,
          token1: result.token1,
          fee: result.fee / 10000,
          startTime: result.startTime,
          endTime: result.endTime,
          numberOfStakes: result.numberOfStakes,
          totalRewardUnclaimed: result.totalRewardUnclaimed,
          totalSecondsClaimedX128: result.totalSecondsClaimedX128,
          minDuration: result.minDuration,
          outputDaily:
            result.totalRewardUnclaimed
              .div(result.endTime.sub(result.startTime.sub(result.totalSecondsClaimedX128.shr(128))))
              .mul(60 * 60 * 24) ?? BigNumber.from(0),
        }
      })
    }
    return undefined
  }, [loading, error, stakingAdress, results])
  const resultInfos = incentiveInfos?.filter(
    (incentive) => incentive.startTime?.toNumber() <= new Date().getTime() / 1000
  )
  return { loading: loading || stakeloading, stakingInfo: resultInfos ?? undefined }
}

/**
 * @description: get the user's unclaimed rewards
 * @param {*}
 * @return {*}
 */
export function useClaimNum(): BigNumber {
  const { account, chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)

  const uni = chainId && STAKING_REWARDS_INFO[chainId]?.rewardToken
  const { result: rewards } = useSingleCallResult(tokenContract, 'rewards', [
    uni ? uni.address : undefined,
    account ?? undefined,
  ])
  return rewards?.[0]
}

/**
 * @description: get all Deposits
 * @param {BigNumber} tokenIds
 * @return {*}
 */
export function useDeposits(tokenIds: BigNumber[]): DepositResults {
  const { chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)

  const tokenIdsArgs = useMemo(() => {
    if (tokenIds) {
      const tokenRequests = []
      for (let i = 0; i < tokenIds.length; i++) {
        tokenRequests.push([tokenIds[i]])
      }
      return tokenRequests
    }
    return []
  }, [tokenIds])
  const stakes = useSingleContractMultipleData(tokenContract, 'stakes', tokenIdsArgs)
  const rewards = useSingleContractMultipleData(tokenContract, 'getRewardInfo', tokenIdsArgs)
  const stakes_loading = useMemo(() => stakes.some(({ loading }) => loading), [stakes])
  const stakes_error = useMemo(() => stakes.some(({ error }) => error), [stakes])
  const rewards_loading = useMemo(() => rewards.some(({ loading }) => loading), [rewards])
  const rewards_error = useMemo(() => rewards.some(({ error }) => error), [rewards])
  const stakeInfos = useMemo(() => {
    if (!stakes_loading && !stakes_error && !rewards_loading && !rewards_error && stakes.length === rewards.length) {
      return stakes?.map((call, i) => {
        const result = call.result as CallStateResult
        return {
          secondsPerLiquidityInsideInitialX128: result?.secondsPerLiquidityInsideInitialX128,
          liquidity: result?.liquidity,
          incentiveId: result?.incentiveId,
          startTime: result?.startTime,
        }
      })
    }
    return undefined
  }, [stakes_loading, stakes_error, rewards_loading, rewards_error, stakes, rewards.length])
  const rewardInfos = useMemo(() => {
    if (!stakes_loading && !stakes_error && !rewards_loading && !rewards_error && stakes.length === rewards.length) {
      return rewards?.map((call, i) => {
        const result = call.result as CallStateResult
        return {
          reward: result?.reward,
          secondsInsideX128: result?.secondsInsideX128,
        }
      })
    }
    return undefined
  }, [stakes_loading, stakes_error, rewards_loading, rewards_error, stakes.length, rewards])
  const claimInfos = stakeInfos?.map((stake, index) => {
    return {
      tokenid: tokenIds[index],
      secondsPerLiquidityInsideInitialX128: stake.secondsPerLiquidityInsideInitialX128,
      liquidity: stake?.liquidity,
      incentiveId: stake.incentiveId,
      startTime: stake.startTime,
      reward: rewardInfos ? rewardInfos[index].reward : undefined,
      secondsInsideX128: rewardInfos ? rewardInfos[index].secondsInsideX128 : undefined,
    }
  })
  return { loading: stakes_loading || rewards_loading, depositInfo: claimInfos ?? [] }
}

export function useReferrer() {
  const { account, chainId } = useActiveWeb3React()
  const stakingAdress = chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined
  const tokenContract = useStakingContract(stakingAdress)
  const { result: rewards } = useSingleCallResult(tokenContract, 'referrer', [account ?? undefined])
  return rewards?.[0]
}
