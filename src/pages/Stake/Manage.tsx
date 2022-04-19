import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { left, right } from '@popperjs/core'
import { Position } from '@uniswap/v3-sdk'
import { OutlineCard } from 'components/Card'
import ClaimRewardModal from 'components/earn/ClaimRewardModal'
import StakingModal from 'components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components/earn/styled'
import UnstakingModal from 'components/earn/UnstakingModal'
import { AutoRow, RowBetween } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useColor } from 'hooks/useColor'
import { usePool } from 'hooks/usePools'
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

import depositIcon from '../../assets/images/deposit.png'
import rewardIcon from '../../assets/images/rewards.png'
import { BaseButton, ButtonEmpty, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { useClaimNum, useDeposits, useIncentiveInfo, useTokens } from '../../state/stake/hooks copy'
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
const Proposal = styled(TopSection)`
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-gap: 0px;
  align-items: center;
  z-index: 1;
  align-items: center;
  text-align: left;
  outline: none;
  grid-template-columns: 60px 1fr 120px;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 60px 1fr 70px;
  `}
`
const Clou = styled(TopSection)`
  display: grid;
  grid-gap: 0px;
  z-index: 1;
  align-items: center;
  grid-template-columns: 130px 1fr;
  ${({ theme }) => theme.mediaWidth.upToSmall`
grid-template-columns:  1fr;
`}
`
const Proposal2 = styled(TopSection)`
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  border-radius: 12px;
  display: grid;
  grid-gap: 0px;
  align-items: center;
  z-index: 1;
  align-items: center;
  text-align: left;
  outline: none;
  grid-template-columns: 60px 1fr 120px;
  color: ${({ theme }) => theme.text1};
  text-decoration: none;
  background-color: ${({ theme }) => theme.bg2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 60px 1fr  70px;
  `}
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
  font-weight: 400;
  flex: 1;
  max-width: 420px;
  white-space: initial;
  word-wrap: break-word;
  padding-right: 8px;
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
  padding: 8px;
  border-radius: 8px;
  width: 120px;
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
  width:  70px;
  `}
`
export const DepositIcon = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`
const StatButton = styled(ButtonPrimary)`
  padding: 8px;
  border-radius: 8px;
  width: 120px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
width:  70px;
`}
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
  history,
}: RouteComponentProps<{ index?: string }>) {
  const { account } = useActiveWeb3React()
  const incentiveId = Number(index)
  const stakingInfo = useIncentiveInfo(incentiveId)
  // get currencies and pair
  const [currencyA, currencyB] = [stakingInfo?.token0, stakingInfo?.token1]
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped

  //get and filter positions
  const { positions, loading: positionsLoading } = useV3Positions(account)

  //get pool
  // const poolPros: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = filteredPositions.map(
  //   (ps) => {
  //     return [tokenA, tokenB, ps.fee]
  //   }
  // )
  const result = usePool(tokenA, tokenB, stakingInfo?.fee ? stakingInfo.fee * 10000 : undefined)

  const pools = result[1]
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
      const p = filteredPositions.map((ps, index) => {
        if (pools && ps.liquidity && typeof ps.tickLower === 'number' && typeof ps.tickUpper === 'number') {
          return new Position({
            pool: pools,
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
  }, [filteredPositions, pools])

  //get unclaim opc
  const claimRewards = useClaimNum()
  const rewards = Big2number(claimRewards, stakingInfo?.rewardToken?.decimals ?? 18)
  const countUpRewards = rewards?.toFixed(6) ?? '0'
  const countUpRewardsPrevious = usePrevious(countUpRewards) ?? '0'
  //get and filter staked positions
  const tokenIds = useTokens()
  const rewardInfos = useDeposits(tokenIds).filter((rw) => rw.incentiveId.toNumber() === incentiveId)
  const liquidity = rewardInfos.map((ps) => ps.liquidity)
  const tolLiquidity =
    liquidity.length &&
    Big2number(
      liquidity.reduce((prev, lq) => {
        return prev.add(lq)
      }),
      18
    )
  //caculate your rate
  const yourRate = useMemo(() => {
    if (pools && tolLiquidity && stakingInfo) {
      if (!tolLiquidity) return 0
      if (numFixed(stakingInfo?.outputDaily, 18) === '<0.0001') return '<0.0001'
      const rate =
        Big2number(stakingInfo?.outputDaily, 18) * (tolLiquidity / JSBI2num(pools?.liquidity ?? JSBI.BigInt(0), 18))
      return rate > 0.0001 ? rate.toFixed(4) : '<0.0001'
    }
    return 0
  }, [pools, stakingInfo, tolLiquidity])

  const [showStakingModal, setShowStakingModal] = useState(false) // toggle for staking modal and unstaking modal
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)
  // fade cards if nothing staked or nothing earned yet
  const disableTop = !tolLiquidity || tolLiquidity === 0

  const token = currencyA?.isNative ? tokenB : tokenA
  const backgroundColor = useColor(token)

  function dateFormat(longTypeDate: number) {
    let dateType = ''
    const date = new Date()
    date.setTime(longTypeDate * 1000)
    const month = date.getMonth() + 1
    dateType = date.getFullYear() + '-' + month + '-' + date.getDate() //yyyy-MM-dd格式日期
    return dateType
  }

  const [tokenId, setTokenId] = useState<number | undefined>()
  const [stakeliquidity, setLiquidity] = useState<number | undefined>()
  const [stakedReward, setReward] = useState<number | undefined>()
  const [tokenRate, setRate] = useState<number | string | undefined>()

  function deposit(tokenid: number, liquidity: JSBI) {
    setTokenId(tokenid)
    const rate = () => {
      if (pools && stakingInfo) {
        if (!liquidity) return 0
        if (numFixed(stakingInfo?.outputDaily, 18) === '<0.0001') return '<0.0001'
        const rate = Big2number(stakingInfo?.outputDaily, 18) * JSBI.toNumber(JSBI.divide(liquidity, pools?.liquidity))
        return rate > 0.0001 ? rate : '<0.0001'
      }
      return 0
    }
    setRate(rate)
    setShowStakingModal(true)
  }
  function Unstake(tokenid: number, liquidity: BigNumber, reward: BigNumber) {
    setTokenId(tokenid)
    setLiquidity(Big2number(liquidity, 18))
    setReward(Big2number(reward, 18))
    setShowUnstakingModal(true)
  }
  function claim() {
    setShowClaimRewardModal(true)
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

  function reload() {
    history.push(`/stake/${incentiveId}`)
  }
  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <ThemedText.MediumHeader style={{ margin: 0 }}>
          {currencyA?.symbol}-{currencyB?.symbol} ({stakingInfo?.fee.toFixed(1)}%) <Trans>Liquidity Mining</Trans>
        </ThemedText.MediumHeader>
        <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} />
      </RowBetween>

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
            tokenRate={tokenRate}
            poolId={index ?? ''}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
            tokenId={tokenId}
            liquidity={stakeliquidity ?? 0}
            rewards={stakedReward}
            reload={() => reload()}
            poolId={index ?? ''}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
            claimRewards={claimRewards}
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
                  <ThemedText.White fontWeight={500}>
                    <Trans>Minimum Duration</Trans>
                    {stakingInfo?.minDuration ?? 0}
                    {'  '}
                    <Trans>Day</Trans>
                  </ThemedText.White>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <ThemedText.White fontSize={36} fontWeight={600}>
                    {tolLiquidity}
                  </ThemedText.White>
                  <ThemedText.White>
                    <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                      ⚡
                    </span>
                    {numFixed(stakingInfo?.outputDaily, 18)} {stakingInfo?.rewardToken?.symbol}
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
                    <Trans>Your unclaimed OPC</Trans>
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
                    duration={1}
                  />
                </ThemedText.LargeHeader>
                <ThemedText.Black fontSize={16} fontWeight={500}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>
                  {yourRate} {stakingInfo?.rewardToken?.symbol}
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
        {positionsLoading ? <PositionsLoadingPlaceholder /> : null}
        {!positionsLoading && filteredPositions?.length === 0 && rewardInfos?.length === 0 && (
          <OutlineCard>
            <Trans>No available token</Trans>
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
              <ButtonDeposit onClick={() => deposit(Number(tokenid), p?.liquidity ?? JSBI.BigInt(0))}>
                <Trans>Stake</Trans>
              </ButtonDeposit>
            </Proposal>
          )
        })}
        {rewardInfos?.map((p, key) => {
          return (
            <Proposal2 key={key}>
              <ProposalNumber as={Link} to={`/pool/${p?.tokenid?.toString()}`} style={{ marginRight: '12px ' }}>
                #{p?.tokenid?.toString()}
              </ProposalNumber>
              <Clou>
                <div style={{ float: left }}>
                  <img src={depositIcon} alt={'Icon'} style={{ width: '18px', marginRight: '8px ', float: left }} />
                  <ProposalTitle style={{ float: left }}>{dateFormat(p?.startTime.toNumber())}</ProposalTitle>
                </div>
                {/* <div>
                  <div></div>
                <ProposalTitle style={{ paddingRight: '2px ', float: right }}>
                  {numFixed(p?.liquidity, 18)}
                </ProposalTitle>
                </div>
                <div></div> */}
                <div style={{ float: right }}>
                  <img src={rewardIcon} alt={'Icon'} style={{ width: '18px', marginRight: '8px ', float: left }} />
                  <ProposalTitle style={{ float: left }}>
                    {numFixed(p?.reward, 18)} {stakingInfo?.rewardToken?.symbol}
                  </ProposalTitle>
                </div>
              </Clou>
              <div>
                <StatButton
                  style={{ float: right }}
                  onClick={() => Unstake(p?.tokenid.toNumber(), p?.liquidity, p?.reward)}
                >
                  <Trans>Unstake</Trans>
                </StatButton>
              </div>
            </Proposal2>
          )
        })}
      </TopSection>
    </PageWrapper>
  )
}
