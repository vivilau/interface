import { Trans } from '@lingui/macro'
import { left, right } from '@popperjs/core'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { RowBetween } from 'components/Row'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { StakingInfo } from 'state/stake/hooks copy'
import styled from 'styled-components/macro'
import { numFixed } from 'utils/numberHelper'
import { unwrappedToken } from 'utils/unwrappedToken'

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
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 30px 1fr 70px;
  `};
`

const CustomRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr 2fr;
  grid-gap: 0px;
  align-items: center;
  padding-top: 1rem;
  padding-bottom: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 130px 1fr 150px;
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
  font-size: 14px;
  color: white;
  opacity: 0.8;
  float: left;
  height: 1.2rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  font-size: 14px;
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
  const token0 = stakingInfo.token0
  const token1 = stakingInfo.token1
  const rewardToken = stakingInfo.rewardToken
  const currency0 = unwrappedToken(stakingInfo.token0)
  const currency1 = unwrappedToken(stakingInfo.token1)
  const fee = stakingInfo.fee.toFixed(1)
  const numberOfStakes = stakingInfo.numberOfStakes
  const minDuration = stakingInfo.minDuration
  // get the color of the token
  const token = currency0.isNative ? token1 : token0
  const backgroundColor = useColor(token)
  const index = stakingInfo.index
  return (
    <Link to={`/stake/${index.toString()}`} style={{ textDecoration: 'none' }}>
      <Wrapper showBackground={false} bgColor={backgroundColor}>
        <CardBGImage desaturate />
        <CardNoise />

        <TopSection>
          <div style={{ marginLeft: '10px' }}>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
          </div>
          <ThemedText.White style={{ marginLeft: '8px' }} fontSize="18px">
            {currency0.symbol}-{currency1.symbol}
            {'  '}
            {'  '}
            {fee}%
          </ThemedText.White>
          <div style={{ marginRight: '8px' }}>
            <CurrencyLogo style={{ marginRight: '0.2rem', float: left }} currency={rewardToken} size={'18px'} />
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
              <StatText>
                {stakingInfo.minDuration}
                <Trans>day</Trans>
              </StatText>
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
                {stakingInfo ? <Trans>{stakingInfo?.outputDaily} OPC/day</Trans> : '-'}
              </ThemedText.Black>
            </BottomSection>
          </>
        )}
      </Wrapper>
    </Link>
  )
}
