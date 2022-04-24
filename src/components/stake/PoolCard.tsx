import { BigNumber } from '@ethersproject/bignumber'
import { Trans } from '@lingui/macro'
import { left, right } from '@popperjs/core'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { RowBetween } from 'components/Row'
import { useCurrency } from 'hooks/Tokens'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { StakingInfo } from 'state/stake/hooks'
import styled from 'styled-components/macro'
import { numFixed } from 'utils/numberHelper'

import { useColor } from '../../hooks/useColor'
import { ThemedText } from '../../theme'
import { Break, CardBGImage, CardNoise } from '../earn/styled'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin: 1rem;
  // ${({ theme }) => theme.mediaWidth.upToSmall`
  // display: none;
`};
`

const Wrapper = styled(AutoColumn)<{ showBackground: boolean; bgColor: any }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '1')};
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%, ${showBackground ? theme.black : theme.bg5} 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;

  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 4rem;
  grid-gap: 0px;
  align-items: center;
  padding-left: 1rem;
  padding-top: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 30px 1fr 65px;
  `};
`

const BottomSection = styled.div<{ showBackground: boolean }>`
  padding: 12px 16px;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '0.4')};
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  z-index: 1;
`
const StyledDiv = styled.div`
  align-items: left;
  text-align: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: grid;
  grid-template-columns: 1fr;
  `};
`
const StatText = styled(Text)`
  font-weight: 500;
  font-size: 15px;
  color: white;
  opacity: 0.8;
  float: left;
  height: 1.2rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  height:1.6rem;
`};
`
const Symbol = styled(Text)`
  font-weight: 500;
  font-size: 14px;
  color: white;
  float: left;
  opacity: 0.7;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
`};
`

export default function PoolCard({ stakingInfo }: { stakingInfo: StakingInfo }) {
  const token0 = useCurrency(stakingInfo.token0) ?? undefined
  const token1 = useCurrency(stakingInfo.token1) ?? undefined
  const rewardToken = useCurrency(stakingInfo.rewardToken)
  const fee = stakingInfo.fee.toFixed(1)
  const numberOfStakes = stakingInfo.numberOfStakes
  const minDuration = useMemo(() => {
    const duration = stakingInfo.minDuration?.div(60 * 60 * 24)
    return stakingInfo.minDuration > BigNumber.from(duration.toNumber() * (60 * 60 * 24))
      ? duration.toNumber() + 1
      : duration.toNumber()
  }, [stakingInfo.minDuration])

  // get the color of the token
  const token = token0?.isNative ? token1 : token0
  const backgroundColor = useColor(token?.wrapped)
  const index = stakingInfo.index
  return (
    <Link to={`/stake/${index.toString()}`} style={{ textDecoration: 'none' }}>
      <Wrapper showBackground={false} bgColor={backgroundColor}>
        <CardBGImage desaturate />
        <CardNoise />

        <TopSection>
          <div style={{ marginLeft: '10px' }}>
            <DoubleCurrencyLogo currency0={token0} currency1={token1} size={24} />
          </div>
          <ThemedText.White style={{ marginLeft: '8px' }} fontSize="18px">
            {token0?.symbol}-{token1?.symbol}
            {'  '}
            {'  '}
            {fee}%
          </ThemedText.White>
          <div style={{ marginRight: '8px' }}>
            <CurrencyLogo style={{ float: left }} currency={rewardToken} size={'18px'} />
            <ThemedText.White style={{ textAlign: 'center', float: right, fontSize: '16px' }}>
              <Trans>{rewardToken?.symbol}</Trans>
            </ThemedText.White>
          </div>
        </TopSection>

        <StatContainer>
          <RowBetween>
            <StyledDiv>
              <StatText>
                <Trans>Staked</Trans>
              </StatText>
              <Symbol>{':'}&nbsp; &nbsp;</Symbol>
              <StatText>{numberOfStakes.toNumber()}</StatText>
            </StyledDiv>
            <StyledDiv>
              <StatText style={{ float: left, marginLeft: '0.5rem' }}>
                <Trans>Min Duration</Trans>
              </StatText>
              <Symbol>{':'}&nbsp; &nbsp;</Symbol>
              {minDuration ? (
                <StatText>
                  {minDuration}
                  <Trans>day</Trans>
                </StatText>
              ) : (
                <StatText>
                  <Trans>TTL</Trans>
                </StatText>
              )}
            </StyledDiv>
            <StyledDiv>
              <StatText>
                <Trans>Pool Rate</Trans>
              </StatText>
              <Symbol>{':'}&nbsp; &nbsp;</Symbol>
              <StatText>
                {stakingInfo && (
                  <>
                    {numFixed(stakingInfo?.outputDaily, 18)}
                    &nbsp;
                    {rewardToken?.symbol}
                    {'  '}/{'  '}
                    <Trans>day</Trans>
                  </>
                )}
              </StatText>
            </StyledDiv>
          </RowBetween>
        </StatContainer>

        {false && (
          <>
            <Break />
            <BottomSection showBackground={false}>
              <ThemedText.Black color={'white'} fontWeight={500}>
                <span>
                  <Trans>Your rate</Trans>
                </span>
              </ThemedText.Black>

              <ThemedText.Black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                  ⚡
                </span>
                {stakingInfo ? <Trans>{stakingInfo?.outputDaily} OPK/day</Trans> : '-'}
              </ThemedText.Black>
            </BottomSection>
          </>
        )}
      </Wrapper>
    </Link>
  )
}
