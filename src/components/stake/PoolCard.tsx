import { Trans } from '@lingui/macro'
import { left, right } from '@popperjs/core'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useV3Positions } from 'hooks/useV3Positions'
import { StakingInfo } from 'state/stake/hooks copy'
import styled from 'styled-components/macro'
import { PositionDetails } from 'types/position'
import { unwrappedToken } from 'utils/unwrappedToken'

import { useColor } from '../../hooks/useColor'
import { StyledInternalLink, ThemedText } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { Break, CardBGImage, CardNoise } from '../earn/styled'
import { RowBetween } from '../Row'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  display: none;
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
  grid-template-columns: 48px 1fr 2fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 2fr 96px;
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
  align-items: center;
  text-align: center;
`
export default function PoolCard({ stakingInfo }: { stakingInfo: StakingInfo }) {
  const { account, chainId, library } = useActiveWeb3React()
  const token0 = stakingInfo.token0
  const token1 = stakingInfo.token1
  const rewardToken = stakingInfo.rewardToken
  const currency0 = unwrappedToken(stakingInfo.token0)
  const currency1 = unwrappedToken(stakingInfo.token1)
  const fee = stakingInfo.fee.toFixed(1)
  const numberOfStakes = stakingInfo.numberOfStakes
  const minDuration = stakingInfo.minDuration
  const outputDaily = stakingInfo.outputDaily
  // get the color of the token
  const token = currency0.isNative ? token1 : token0
  const backgroundColor = useColor(token)
  const isStaking = false
  // function getPositions
  const { positions, loading: positionsLoading } = useV3Positions(account)

  const openPositions =
    positions?.reduce<PositionDetails[]>((acc, p) => {
      !p.liquidity?.isZero() && acc.push(p)
      return acc
    }, []) ?? []
  console.error('positions', positions?.length)
  const filteredPositions = openPositions.filter(
    (ps) =>
      ps.liquidity &&
      [token0.address, token1.address].indexOf(ps.token0) !== -1 &&
      [token0.address, token1.address].indexOf(ps.token1) !== -1
  )
  const tokenid = filteredPositions.length ? filteredPositions[0].tokenId.toNumber() : undefined
  console.error('tokenid', filteredPositions.length)
  return (
    <Wrapper showBackground={isStaking} bgColor={backgroundColor}>
      <CardBGImage desaturate />
      <CardNoise />

      <TopSection>
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
        <ThemedText.White fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
          {currency0.symbol}-{currency1.symbol}
        </ThemedText.White>
        <ThemedText.White fontWeight={500} fontSize={14}>
          {fee}%
        </ThemedText.White>
        <StyledInternalLink to={`/stake/${currencyId(currency0)}/${currencyId(currency1)}`} style={{ width: '100%' }}>
          <ButtonPrimary padding="8px" $borderRadius="8px">
            {isStaking ? <Trans>Manage</Trans> : <Trans>Deposit</Trans>}
          </ButtonPrimary>
        </StyledInternalLink>
      </TopSection>

      <StatContainer>
        <RowBetween>
          <StyledDiv>
            <CurrencyLogo style={{ marginRight: '0.5rem', float: left }} currency={rewardToken} size={'24px'} />
            <ThemedText.White style={{ textAlign: 'center', float: right, fontSize: '16px' }}>
              <Trans>{rewardToken ? rewardToken?.symbol : stakingInfo.rewardToken}</Trans>
            </ThemedText.White>
          </StyledDiv>
          <ThemedText.White>{true ? <Trans>{minDuration} day</Trans> : <Trans> ETH</Trans>}</ThemedText.White>
        </RowBetween>
        <RowBetween>
          <ThemedText.White>
            <Trans>{numberOfStakes}</Trans>
          </ThemedText.White>
          <ThemedText.White>{stakingInfo ? <Trans>{stakingInfo?.outputDaily}/day</Trans> : '-'}</ThemedText.White>
        </RowBetween>
      </StatContainer>

      {isStaking && (
        <>
          <Break />
          <BottomSection showBackground={true}>
            <ThemedText.Black color={'white'} fontWeight={500}>
              <span>
                <Trans>Your rate</Trans>
              </span>
            </ThemedText.Black>

            <ThemedText.Black style={{ textAlign: 'right' }} color={'white'} fontWeight={500}>
              <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                ⚡
              </span>
              {stakingInfo ? (
                <Trans>
                  {stakingInfo.numberOfStakes}
                  UNI / week
                </Trans>
              ) : (
                '-'
              )}
            </ThemedText.Black>
          </BottomSection>
        </>
      )}
    </Wrapper>
  )
}
