import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, Position } from '@uniswap/v3-sdk'
import { OutlineCard } from 'components/Card'
import ClaimRewardModal from 'components/earn/ClaimRewardModal'
import StakingModal from 'components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import UnstakingModal from 'components/earn/UnstakingModal'
import { AutoRow, RowBetween } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useColor } from 'hooks/useColor'
import { usePools } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { useV3Positions } from 'hooks/useV3Positions'
import JSBI from 'jsbi'
import { Spinner } from 'lib/icons'
import { LoadingRows } from 'pages/Pool/styleds'
import darken from 'polished/lib/color/darken'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RouteComponentProps } from 'react-router-dom'
import { Button } from 'rebass/styled-components'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { CountUp } from 'use-count-up'
import { Big2number, JSBI2num, numFixed } from 'utils/numberHelper'

import { BaseButton, ButtonEmpty, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { useCurrency } from '../../hooks/Tokens'
import { useClaimNum, useDeposits, useStakingInfo, useTokens } from '../../state/stake/hooks copy'
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

const PoolData = styled(DataCard)`
  background: none;
  border: 1px solid ${({ theme }) => theme.bg4};
  padding: 1rem;
  z-index: 1;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`
const TopSection = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`
const Proposal = styled.span`
  padding: 0.75rem 1rem;
  width: 100%;
  margin-top: 1rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  outline: none;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg2};
`

const ProposalNumberButton = styled(Button)`
  opacity: 0.6;
  flex: 0 0 40px;
  color: ${({ theme }) => theme.green1};
`
const ProposalNumber = styled(Button)`
  opacity: 0.6;
  flex: 0 0 40px;
  color: ${({ theme }) => theme.green1};
`
const ProposalTitle = styled.span`
  font-weight: 600;
  flex: 1;
  max-width: 420px;
  white-space: initial;
  word-wrap: break-word;
  padding-right: 10px;
`

const WrapSmall = styled(RowBetween)`
  margin-bottom: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
  `};
`

const TextButton = styled(ThemedText.Main)`
  color: ${({ theme }) => theme.primary1};
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`
const StyledProposalContainer = styled(Button)`
  font-size: 0.825rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 8px;
  color: ${({ theme }) => theme.green1};
  border: 1px solid;
  width: fit-content;
  justify-self: flex-end;
  text-transform: uppercase;
  flex: 0 0 100px;
  text-align: center;
  cursor: pointer;
`
const ButtonDeposit = styled(BaseButton)`
  background-color: ${({ theme }) => theme.green1};
  color: white;
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.05, theme.green1)};
    background-color: ${({ theme }) => darken(0.05, theme.green1)};
  }
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.green1)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.green1)};
    background-color: ${({ theme }) => darken(0.1, theme.green1)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle, disabled }) =>
      altDisabledStyle ? (disabled ? theme.green1 : theme.bg2) : theme.bg2};
    color: ${({ altDisabledStyle, disabled, theme }) =>
      altDisabledStyle ? (disabled ? theme.white : theme.text2) : theme.text2};
    cursor: auto;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`
export const DepositIcon = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export default function Manage({
  match: {
    params: { currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account } = useActiveWeb3React()

  // get currencies and pair
  const [currencyA, currencyB] = [useCurrency(currencyIdA), useCurrency(currencyIdB)]
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped

  //get stakeinfo
  const stakingInfos = useStakingInfo()
  const stakingInfo = stakingInfos?.filter(
    (ps) =>
      [tokenA?.address, tokenB?.address].indexOf(ps.token0.address) !== -1 &&
      [tokenA?.address, tokenB?.address].indexOf(ps.token1.address) !== -1
  )?.[0]
  const incentiveId = stakingInfo && stakingInfos?.indexOf(stakingInfo)
  //get and filter positions
  const { positions, loading: positionsLoading } = useV3Positions(account)

  const openPositions =
    positions?.reduce<PositionDetails[]>((acc, p) => {
      !p.liquidity?.isZero() && acc.push(p)
      return acc
    }, []) ?? []
  const filteredPositions = openPositions.filter(
    (ps) =>
      ps.liquidity &&
      [tokenA?.address, tokenB?.address].indexOf(ps.token0) !== -1 &&
      [tokenA?.address, tokenB?.address].indexOf(ps.token1) !== -1
  )

  //get pool
  const poolPros: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = filteredPositions.map(
    (ps) => {
      return [tokenA, tokenB, ps.fee]
    }
  )
  const pools = usePools(poolPros)

  const positionInfos = useMemo(() => {
    if (filteredPositions) {
      const p = filteredPositions.map((ps, index) => {
        const pool = pools.length && pools[index][1]
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
  }, [pools, filteredPositions])
  const liquidity = filteredPositions.map((ps) => ps.liquidity)
  const tolLiquidity =
    liquidity.length &&
    Big2number(
      liquidity.reduce((prev, lq) => {
        return prev.add(lq)
      }),
      18
    )

  //get unclaim opc
  const rewards = useClaimNum()
  const countUpRewards = rewards?.toFixed(6) ?? '0'
  const countUpRewardsPrevious = usePrevious(countUpRewards) ?? '0'
  //get and filter staked positions
  const tokenIds = useTokens()
  const rewardInfos = useDeposits(tokenIds).filter((rw) => rw.incentiveId.toNumber() === incentiveId)
  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  // fade cards if nothing staked or nothing earned yet
  const disableTop = !tolLiquidity || tolLiquidity === 0

  const token = currencyA?.isNative ? tokenB : tokenA
  const backgroundColor = useColor(token)

  function dateFormat(longTypeDate: number) {
    let dateType = ''
    const date = new Date()
    date.setTime(longTypeDate)
    dateType = date.getFullYear() + '/' + date.getMonth() + '/' + date.getDay() //yyyy-MM-dd格式日期
    return dateType
  }

  const [tokenId, setTokenId] = useState<number | undefined>()
  const [stakeliquidity, setLiquidity] = useState<number | undefined>()
  const [stakedReward, setReward] = useState<number | undefined>()

  function deposit(tokenid: number, liquidity: JSBI) {
    setTokenId(tokenid)
    setLiquidity(JSBI2num(liquidity, 18))
    setShowStakingModal(true)
  }
  function Unstake(tokenid: number, liquidity: BigNumber, reward: BigNumber) {
    console.error('unstake')
    setTokenId(tokenid)
    setLiquidity(Big2number(liquidity, 18))
    setReward(Big2number(reward, 18))
    setShowUnstakingModal(true)
  }
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
        <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <ThemedText.Body style={{ margin: 0 }}>
              <Trans>Minimum Duration </Trans>
            </ThemedText.Body>
            <ThemedText.Body fontSize={24} fontWeight={500}>
              {stakingInfo?.minDuration} Day
            </ThemedText.Body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <ThemedText.Body style={{ margin: 0 }}>
              <Trans>Pool Rate</Trans>
            </ThemedText.Body>
            <ThemedText.Body fontSize={24} fontWeight={500}>
              {stakingInfo ? (
                <Trans>
                  {stakingInfo?.outputDaily} {stakingInfo?.rewardToken.symbol} / day
                </Trans>
              ) : (
                <Trans>0 </Trans>
              )}
            </ThemedText.Body>
          </AutoColumn>
        </PoolData>
      </DataRow>

      {/* //有矿池，没有对应流动时显示 */}
      {false && (
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <ThemedText.White fontWeight={600}>
                  <Trans>Step 1. Get UNI-V2 Liquidity tokens</Trans>
                </ThemedText.White>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <ThemedText.White fontSize={14}>
                  <Trans>
                    UNI-V2 LP tokens are required. Once you&apos;ve added liquidity to the {currencyA?.symbol}-
                    {currencyB?.symbol} pool you can stake your liquidity tokens on this page.
                  </Trans>
                </ThemedText.White>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                $borderRadius="8px"
                width={'fit-content'}
                // as={Link}
                // to={`//${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
              >
                <Trans>
                  Add {currencyA?.symbol}-{currencyB?.symbol} liquidity
                </Trans>
              </ButtonPrimary>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      )}
      {stakingInfo && (
        <>
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingInfo={stakingInfo}
            tokenId={tokenId}
            liquidity={stakeliquidity ?? 0}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
            tokenId={tokenId}
            liquidity={stakeliquidity ?? 0}
            rewards={stakedReward}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
            rewards={rewards}
            liquidity={tolLiquidity}
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
                    <Trans>Your Total liquidity </Trans>
                  </ThemedText.White>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <ThemedText.White fontSize={36} fontWeight={600}>
                    {tolLiquidity}
                  </ThemedText.White>
                  <ThemedText.White>
                    <Trans>
                      {currencyA?.symbol}-{currencyB?.symbol}
                    </Trans>
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
                    <Trans>Your unclaimed OPC</Trans>
                  </ThemedText.Black>
                </div>
                {true && (
                  <ButtonEmpty
                    padding="8px"
                    $borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    <Trans>Claim</Trans>
                  </ButtonEmpty>
                )}
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
                    duration={1}
                  />
                </ThemedText.LargeHeader>
                <ThemedText.Black fontSize={16} fontWeight={500}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>

                  {stakingInfo ? (
                    <Trans>
                      {stakingInfo.outputDaily} {stakingInfo.rewardToken.symbol} / day
                    </Trans>
                  ) : (
                    <Trans>0 / day</Trans>
                  )}
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
        {positionsLoading ? <PositionsLoadingPlaceholder /> : null}
        {!positionsLoading && filteredPositions?.length === 0 && rewardInfos?.length === 0 && (
          <OutlineCard>
            <Trans>No active pools</Trans>
          </OutlineCard>
        )}
        {positionInfos?.map((p, key) => {
          const tokenid = filteredPositions[key].tokenId.toString()
          return (
            <Proposal key={key}>
              <ProposalNumberButton as={Link} to={`/pool/${tokenid}`}>
                #{tokenid}
              </ProposalNumberButton>
              <ProposalTitle>
                {p?.amount0.toSignificant(4)} {tokenA?.symbol} / {p?.amount1.toSignificant(4)} {tokenB?.symbol}
              </ProposalTitle>
              {/* <StyledProposalContainer onClick={() => deposit(Number(tokenid))}>
                <Trans>Deposit</Trans>
              </StyledProposalContainer> */}
              <ButtonDeposit
                padding="8px"
                $borderRadius="8px"
                width="120px"
                onClick={() => deposit(Number(tokenid), p?.liquidity ?? JSBI.BigInt(0))}
              >
                <Trans>Deposit</Trans>
              </ButtonDeposit>
            </Proposal>
          )
        })}
        {rewardInfos?.map((p, key) => {
          return (
            <Proposal key={key}>
              <ProposalNumber as={Link} to={`/pool/${p?.tokenid?.toString()}`}>
                #{p?.tokenid?.toString()}
              </ProposalNumber>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                {'    '}📥
              </span>
              <ProposalTitle>
                {dateFormat(p?.startTime.toNumber() * 1000)}
                {'  '} {numFixed(p?.liquidity, 18)}
              </ProposalTitle>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                ⚡
              </span>
              <ProposalTitle>
                {numFixed(p?.reward, 18)} {stakingInfo?.rewardToken.symbol}
              </ProposalTitle>
              <ButtonPrimary
                padding="8px"
                $borderRadius="8px"
                width="120px"
                onClick={() => Unstake(p?.tokenid.toNumber(), p?.liquidity, p?.reward)}
              >
                <Trans>Unstake</Trans>
              </ButtonPrimary>
            </Proposal>
          )
        })}
      </TopSection>
    </PageWrapper>
  )
}
