import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { left, right } from '@popperjs/core'
import { Position } from '@uniswap/v3-sdk'
import { OutlineCard } from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import ClaimRewardModal from 'components/earn/ClaimRewardModal'
import StakingModal from 'components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import UnstakingModal from 'components/earn/UnstakingModal'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import StatusBadge from 'components/stake/StatusBadge'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useColor } from 'hooks/useColor'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { usePool } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { useV3Positions, useV3PositionsFromTokenIds } from 'hooks/useV3Positions'
import JSBI from 'jsbi'
import { Spinner } from 'lib/icons'
import { LoadingRows } from 'pages/Pool/styleds'
import darken from 'polished/lib/color/darken'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { Button } from 'rebass/styled-components'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { CountUp } from 'use-count-up'
import { currencyId } from 'utils/currencyId'
import { Big2number, dateFormat, JSBI2num, numFixed } from 'utils/numberHelper'

import depositIcon from '../../assets/images/deposit.png'
import rewardIcon from '../../assets/images/reward.png'
import { ButtonEmpty } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { useCurrency, useToken } from '../../hooks/Tokens'
import { DepositInfo, useClaimNum, useDeposits, useIncentiveInfo, useTokens } from '../../state/stake/hooks'
const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const PositionInfo = styled(AutoColumn)<{ dim: any }>`
  position: relative;
  max-width: 640px;
  width: 100%;
  opacity: ${({ dim }) => (dim ? 0.6 : 1)};
`

const BottomSection = styled(AutoColumn)`
  border-radius: 12px;
  width: 100%;
  position: relative;
`

const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
  z-index: 2;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const Proposal = styled(ButtonEmpty)`
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-gap: 0px;
  align-items: center;
  z-index: 1;
  align-items: center;
  text-align: left;
  cursor: pointer;
  outline: none;
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
  }
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
    text-decoration: none;
  }
  &:active {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
    text-decoration: none;
  }
  grid-template-columns: 60px 1fr 120px;
  color: ${({ theme }) => theme.text1};
  padding-right: 25px;
  background-color: ${({ theme }) => theme.bg2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 55px 1fr 85px;
  padding-right: 8px;
  `}
`
const Clou = styled(TopSection)`
  display: grid;
  grid-gap: 0px;
  z-index: 1;
  align-items: center;
  grid-template-columns: 100px 1fr;
  ${({ theme }) => theme.mediaWidth.upToSmall`
`}
`
const Proposal2 = styled(ButtonEmpty)`
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-gap: 0px;
  align-items: center;
  z-index: 1;
  align-items: center;
  text-align: left;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
  }
  &:focus {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
    text-decoration: none;
  }
  &:active {
    background-color: ${({ theme }) => darken(0.05, theme.bg2)};
    text-decoration: none;
  }
  grid-template-columns: 60px 1fr 120px;
  color: ${({ theme }) => theme.text1};
  padding-right: 25px;
  background-color: ${({ theme }) => theme.bg2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 55px 1fr  70px;  
  padding-right: 8px;
  `}
`
const ProposalNumberButton = styled(Button)`
  opacity: 0.6;
  flex: 0 0 40px;
  color: ${({ theme }) => theme.green1};
`
const Symbol = styled(Text)`
  font-weight: 500;
  flex: 1;
  max-width: 420px;
  white-space: initial;
  word-wrap: break-word;
  padding-right: 4px;
  align-items: center;
  float: left;
  color: #b2b9d2;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  font-weight: 400;
  font-size: 14px;
`};
`
const ProposalTitle = styled.span`
  font-weight: 500;
  flex: 1;
  max-width: 420px;
  white-space: initial;
  word-wrap: break-word;
  padding-right: 8px;
  align-items: center;
  float: left;
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 14px;
  `};
`

const WrapSmall = styled(RowBetween)`
  margin-bottom: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
  `};
`

export const DepositIcon = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`
const ClaimButton = styled(ButtonEmpty)`
  padding: 8px;
  border-radius: 8px;
  width: fit-content;
  color: ${({ theme }) => darken(0.1, theme.green1)};
  border: 1px solid ${({ theme }) => darken(0.1, theme.green1)};
`

export default function Manage({
  match: {
    params: { index },
  },
}: RouteComponentProps<{ index?: string }>) {
  const { account } = useActiveWeb3React()
  const incentiveId = Number(index)
  //  // get incentiveInfo
  const stakingInfo = useIncentiveInfo(incentiveId)
  const expired = stakingInfo?.endTime ? stakingInfo?.endTime?.toNumber() < new Date().getTime() / 1000 : undefined
  const [currencyA, currencyB] = [useCurrency(stakingInfo?.token0), useCurrency(stakingInfo?.token1)]
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped
  const rewardToken = useToken(stakingInfo?.rewardToken)
  const minDuration = useMemo(() => {
    const duration = stakingInfo?.minDuration?.div(60 * 60 * 24)
    if (!duration || !stakingInfo) return undefined
    return stakingInfo.minDuration > BigNumber.from(duration?.toNumber() * (60 * 60 * 24))
      ? duration.toNumber() + 1
      : duration.toNumber()
  }, [stakingInfo])

  //get and filter positions
  const { positions, loading: positionsLoading } = useV3Positions(account)
  const pool = usePool(tokenA, tokenB, stakingInfo?.fee ? stakingInfo.fee * 10000 : undefined)[1]
  const openPositions =
    positions?.reduce<PositionDetails[]>((acc, p) => {
      !p.liquidity?.isZero() && acc.push(p)
      return acc
    }, []) ?? []

  const filteredPositions = openPositions.filter(
    (ps) =>
      ps.liquidity &&
      [tokenA?.address, tokenB?.address].indexOf(ps.token0) !== -1 &&
      [tokenA?.address, tokenB?.address].indexOf(ps.token1) !== -1 &&
      ps.fee / 10000 === stakingInfo?.fee
  )
  const positionInfos = useMemo(() => {
    if (filteredPositions) {
      const p = filteredPositions.map((ps) => {
        if (pool && ps.liquidity && typeof ps.tickLower === 'number' && typeof ps.tickUpper === 'number') {
          return new Position({
            pool,
            liquidity: ps.liquidity.toString(),
            tickLower: ps.tickLower,
            tickUpper: ps.tickUpper,
          })
        }
        return undefined
      })
      return p
    }
    return undefined
  }, [filteredPositions, pool])

  //get unclaim opc
  const claimRewards = useClaimNum()
  const rewards = Big2number(claimRewards, rewardToken?.decimals ?? 18)
  const countUpRewards = rewards?.toFixed(6) ?? '0'
  const countUpRewardsPrevious = usePrevious(countUpRewards) ?? '0'

  //get and filter staked tokenids and info of staked token
  const { loading: tokenLoading, tokens: tokenIds } = useTokens()
  const { loading: depositLoading, depositInfo: depositInfos } = useDeposits(tokenIds)
  const rewardInfos = depositInfos?.filter((rw) => rw.incentiveId.toNumber() === incentiveId)

  const { loading, positions: stakeTokens } = useV3PositionsFromTokenIds(tokenIds)
  const inRangeTokenIds =
    stakeTokens &&
    stakeTokens
      .filter((ps) => !(pool ? pool.tickCurrent < ps.tickLower || pool.tickCurrent >= ps.tickUpper : true))
      .map((ps) => ps.tokenId)
  const liquidity = rewardInfos?.map((ps) =>
    inRangeTokenIds?.indexOf(ps.tokenid) !== -1 ? ps.liquidity : BigNumber.from(0)
  )
  const tolLiquidity =
    liquidity?.length &&
    liquidity?.reduce((prev, lq) => {
      return prev.add(lq)
    })
  //caculate your rate
  const yourRate = useMemo(() => {
    if (pool && tolLiquidity && stakingInfo) {
      if (!tolLiquidity) return 0
      if (numFixed(stakingInfo?.outputDaily, 18) === '<0.0001') return '<0.0001'
      const rate =
        Big2number(stakingInfo?.outputDaily, 18) *
        (Big2number(tolLiquidity, 18) / JSBI2num(pool?.liquidity ?? JSBI.BigInt(0), 18))
      return rate > 0.0001 ? rate.toFixed(4) : '<0.0001'
    }
    return 0
  }, [pool, stakingInfo, tolLiquidity])

  const [showStakingModal, setShowStakingModal] = useState(false) // toggle for staking modal and unstaking modal
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  const token = currencyA?.isNative ? tokenB : tokenA
  const backgroundColor = useColor(token)

  const [tokenId, setTokenId] = useState<number | undefined>()
  const [depositInfo, setDeposit] = useState<DepositInfo | undefined>()
  const [tokenRate, setRate] = useState<number | string | undefined>()

  function deposit(tokenid: number, liquidity: JSBI) {
    setTokenId(tokenid)
    const rate = () => {
      if (pool && stakingInfo) {
        if (!liquidity) return 0
        if (numFixed(stakingInfo?.outputDaily, 18) === '<0.0001') return '<0.0001'
        const rate =
          (Big2number(stakingInfo?.outputDaily, 18) * JSBI.toNumber(liquidity)) / JSBI.toNumber(pool?.liquidity)
        return rate > 0.0001 ? rate.toFixed(4) : '<0.0001'
      }
      return 0
    }
    setRate(rate)
    setShowStakingModal(true)
  }
  function Unstake(ps: DepositInfo) {
    setDeposit(ps)
    setShowUnstakingModal(true)
  }
  function claim() {
    setShowClaimRewardModal(true)
  }
  const blockTime = useCurrentBlockTimestamp()
  const date =
    stakingInfo &&
    rewardInfos &&
    rewardInfos.map((depositInfo) => depositInfo?.startTime.add(stakingInfo.minDuration ?? 0))
  const expire = date && blockTime && date.map((d) => blockTime.gt(d))
  function PositionsLoadingPlaceholder() {
    return (
      <LoadingRows>
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </LoadingRows>
    )
  }
  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <ThemedText.MediumHeader style={{ margin: 0 }}>
          <Trans>
            {currencyA?.symbol}-{currencyB?.symbol} ({stakingInfo?.fee.toFixed(1)}%) Liquidity Mining
          </Trans>
        </ThemedText.MediumHeader>
        <DoubleCurrencyLogo currency0={tokenA ?? undefined} currency1={tokenB ?? undefined} size={24} />
      </RowBetween>

      {stakingInfo && (
        <>
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingInfo={stakingInfo}
            tokenId={tokenId}
            tokenRate={tokenRate}
            poolId={index ?? ''}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
            depositInfo={depositInfo}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
          />
        </>
      )}
      <PositionInfo gap="lg" justify="center" dim={false}>
        {/* //显示矿池 */}
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={false} bgColor={backgroundColor} showBackground={true}>
            <CardSection>
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.White fontWeight={600}>
                    <Trans>Your Total Liquidity </Trans>
                  </ThemedText.White>
                  <ThemedText.White fontWeight={500} style={{ opacity: '0.6' }}>
                    <Trans>Minimum Duration</Trans>
                    {'  :  '}
                    {stakingInfo ? (
                      minDuration ? (
                        <>
                          {minDuration}
                          <Trans>day</Trans>
                        </>
                      ) : (
                        <>
                          <Trans>TTL</Trans>
                        </>
                      )
                    ) : null}
                  </ThemedText.White>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <ThemedText.White fontSize={36} fontWeight={600}>
                    {tolLiquidity && numFixed(tolLiquidity, 18)}
                  </ThemedText.White>
                  <ThemedText.White>
                    <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                      ⚡
                    </span>
                    {numFixed(stakingInfo?.outputDaily, 18)} {rewardToken?.symbol}
                    {'  '}/{'  '}
                    <Trans>day</Trans>
                  </ThemedText.White>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={false}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <ThemedText.Black>
                    <Trans>Your unclaimed {rewardToken?.symbol}</Trans>
                  </ThemedText.Black>
                </div>
                <ClaimButton onClick={() => claim()}>
                  <Trans>Claim</Trans>
                </ClaimButton>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <ThemedText.LargeHeader fontSize={36} fontWeight={600}>
                  <CountUp
                    key={countUpRewards}
                    isCounting
                    decimalPlaces={4}
                    start={parseFloat(countUpRewardsPrevious)}
                    end={parseFloat(countUpRewards)}
                    thousandsSeparator={','}
                    duration={0.01}
                  />
                </ThemedText.LargeHeader>
                <ThemedText.Black fontSize={16} fontWeight={500}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>
                  {yourRate} {rewardToken?.symbol}
                  {'  '}/{'  '}
                  <Trans>day</Trans>
                </ThemedText.Black>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
      </PositionInfo>
      <TopSection gap="2px">
        <WrapSmall>
          <ThemedText.MediumHeader style={{ margin: '0.5rem 0.5rem 0.5rem 0', flexShrink: 0 }}>
            <Trans>tokens</Trans>
          </ThemedText.MediumHeader>
          <AutoRow gap="6px" justify="flex-end"></AutoRow>
        </WrapSmall>
        <>
          {expired === true ? (
            <OutlineCard>
              <Trans>This incentive has expired.</Trans>
            </OutlineCard>
          ) : stakingInfo ? (
            positionsLoading || depositLoading || tokenLoading ? (
              <PositionsLoadingPlaceholder />
            ) : filteredPositions?.length !== 0 || rewardInfos?.length !== 0 || !account ? null : (
              <OutlineCard>
                <Trans>No liquidity token, create a liquidity token first.</Trans>
                <ButtonEmpty
                  padding="8px"
                  $borderRadius="8px"
                  width={'fit-content'}
                  as={Link}
                  style={{ float: 'right', fontSize: '14px', height: '3rem' }}
                  to={`/add/${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
                >
                  <Trans>
                    Add {currencyA?.symbol}-{currencyB?.symbol} liquidity
                  </Trans>
                  {'→'}
                </ButtonEmpty>
              </OutlineCard>
            )
          ) : null}
        </>
        {expired === false &&
          positionInfos?.map((p, key) => {
            const tokenid = filteredPositions[key].tokenId.toString()
            return (
              <Proposal key={key} onClick={() => deposit(Number(tokenid), p?.liquidity ?? JSBI.BigInt(0))}>
                <ProposalNumberButton as={Link} to={`/pool/${tokenid}`}>
                  #{tokenid}
                </ProposalNumberButton>
                <RowBetween>
                  <RowFixed>
                    <CurrencyLogo currency={tokenA} size={'18px'} style={{ marginRight: '0.2rem' }} />
                    <ProposalTitle style={{ paddingRight: '3px' }}>{p?.amount0.toSignificant(4)}</ProposalTitle>
                    <Symbol>{'|'}</Symbol>
                    <CurrencyLogo currency={tokenB} size={'18px'} style={{ marginRight: '0.2rem' }} />
                    <ProposalTitle>{p?.amount1.toSignificant(4)}</ProposalTitle>
                  </RowFixed>
                </RowBetween>
                <StatusBadge staked={true} inRange={true} />
              </Proposal>
            )
          })}
        {rewardInfos?.map((p, key) => {
          return (
            <Proposal2 key={key} style={{ textDecoration: 'none' }} onClick={() => Unstake(p)}>
              <ProposalNumberButton as={Link} to={`/pool/${p?.tokenid?.toString()}`} style={{ marginRight: '12px ' }}>
                #{p?.tokenid?.toString()}
              </ProposalNumberButton>
              <Clou>
                <div style={{ float: left }}>
                  <img
                    src={depositIcon}
                    alt={'Icon'}
                    style={{ width: '19px', float: left, marginTop: '1px', marginRight: '5px' }}
                  />
                  <ProposalTitle>{dateFormat(p?.startTime).substring(2)}</ProposalTitle>
                </div>
                <div style={{ float: right }}>
                  <img src={rewardIcon} alt={'Icon'} style={{ width: '16px', float: left, marginRight: '5px' }} />
                  <ProposalTitle>{numFixed(p?.reward, 18)}</ProposalTitle>
                </div>
              </Clou>
              <StatusBadge staked={false} inRange={expire && expire[key]} />
            </Proposal2>
          )
        })}
      </TopSection>
    </PageWrapper>
  )
}
