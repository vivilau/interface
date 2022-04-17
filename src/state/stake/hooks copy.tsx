import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@uniswap/sdk-core'
import { WRAPPED_NATIVE_CURRENCY } from '@uniswap/smart-order-router'
import { SupportedChainId } from 'constants/chains'
import { DAI, OPK_POLYGON_MUMBAI, USDC_MAINNET, USDT, WBTC } from 'constants/tokens'
import { useAllTokens } from 'hooks/Tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useStakingContract } from 'hooks/useContract'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { numFixed } from 'utils/numberHelper'
export const STAKING_REWARDS_INFO: {
  [chainId: number]: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  1: [
    {
      tokens: [WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token, DAI],
      stakingRewardAddress: '0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711',
    },
    {
      tokens: [WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token, USDC_MAINNET],
      stakingRewardAddress: '0x7FBa4B8Dc5E7616e59622806932DBea72537A56b',
    },
    {
      tokens: [WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token, USDT],
      stakingRewardAddress: '0x6C3e4cb2E96B01F4b866965A91ed4437839A121a',
    },
    {
      tokens: [WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET] as Token, WBTC],
      stakingRewardAddress: '0xCA35e32e7926b96A9988f61d510E038108d8068e',
    },
  ],
  80001: [
    {
      tokens: [WRAPPED_NATIVE_CURRENCY[SupportedChainId.POLYGON_MUMBAI] as Token, OPK_POLYGON_MUMBAI],
      stakingRewardAddress: '0xCA35e32e7926b96A9988f61d510E038108d8068e',
    },
  ],
}
export interface StakingInfo {
  stakeAddress: string
  rewardToken: Token
  token0: Token
  token1: Token
  fee: number
  startTime: BigNumber
  endTime: BigNumber
  numberOfStakes: BigNumber
  totalRewardUnclaimed: BigNumber
  totalSecondsClaimedX128: BigNumber
  minDuration: BigNumber
  outputDaily: string
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

// gets the staking info from the network for the active chain id
export function useTokens(): BigNumber[] {
  const { account } = useActiveWeb3React()
  const tokenContract = useStakingContract('0x72055D6677c98d1B67F65aF21074a737a3C64b52')

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
  return tokenIds
}

export function useStakingInfo(): StakingInfo[] | undefined {
  const stakeAdd = '0x72055D6677c98d1B67F65aF21074a737a3C64b52'
  const tokenContract = useStakingContract(stakeAdd)

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
  const allTokens = useAllTokens()
  const incentiveInfos = useMemo(() => {
    if (!loading && !error) {
      return results.map((call, i) => {
        const result = call.result as CallStateResult
        return {
          stakeAddress: stakeAdd,
          rewardToken: allTokens[result.rewardToken],
          token0: allTokens[result.token0],
          token1: allTokens[result.token1],
          fee: result.fee / 10000,
          startTime: result.startTime,
          endTime: result.endTime,
          numberOfStakes: result.numberOfStakes,
          totalRewardUnclaimed: result.totalRewardUnclaimed,
          totalSecondsClaimedX128: result.totalSecondsClaimedX128,
          minDuration: result.minDuration.div(60 * 60 * 24).toNumber(),
          outputDaily:
            numFixed(
              result.totalRewardUnclaimed.div(
                result.endTime.sub(result.startTime.sub(result.totalSecondsClaimedX128.shr(128))).mul(60 * 60 * 24)
              ),
              18
            ) ?? '0',
        }
      })
    }
    return undefined
  }, [loading, error, results, allTokens])
  return incentiveInfos ?? undefined
}
export function useClaimNum(): number {
  const { account, chainId } = useActiveWeb3React()
  const tokenContract = useStakingContract('0x72055D6677c98d1B67F65aF21074a737a3C64b52')
  const uni = chainId && STAKING_REWARDS_INFO[chainId][0].tokens[1]
  const { result: rewards } = useSingleCallResult(tokenContract, 'rewards', [
    account ?? undefined,
    uni ? uni.address : undefined,
  ])
  return rewards?.[0]?.toNumber()
}

export function useDeposits(tokenIds: BigNumber[]): DepositInfo[] {
  const tokenContract = useStakingContract('0x72055D6677c98d1B67F65aF21074a737a3C64b52')
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
  if (stakeInfos?.length === 0) return []
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
  return claimInfos ?? []
}

export function useUnStake(tokenid: number) {
  const { account, chainId, library } = useActiveWeb3React()
  const stke_address = '0x72055D6677c98d1B67F65aF21074a737a3C64b52'
  const tokenContract = useStakingContract(stke_address)

  // setAttemptingTxn(true)
  const tokenIdsArgs = [tokenid, '0x0000000000000000000000000000000000000000000000000000000000000000']

  const { loading: unStakeLoading, result: unStokeResult } = useSingleCallResult(
    tokenContract,
    'unstakeToken',
    tokenIdsArgs
  )
  if (!tokenContract || !tokenid || !account || !chainId || !library) {
    return
  }
  return unStokeResult
}
