import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import AddReferModal from 'components/earn/AddReferModal'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { LoadingRows } from 'pages/Pool/styleds'
import { useState } from 'react'
import { useWalletModalToggle } from 'state/application/hooks'
import { STAKING_REWARDS_INFO, useReferrer } from 'state/stake/hooks'
import { useStakingInfo } from 'state/stake/hooks'
import styled from 'styled-components/macro'

import { OutlineCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import PoolCard from '../../components/stake/PoolCard'
import { ExternalLink, ThemedText } from '../../theme'
const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

//TODO:use ContrctCall
export default function Stake() {
  const { account, chainId } = useActiveWeb3React()
  const stakingRewardsExist = Boolean(typeof chainId === 'number' && STAKING_REWARDS_INFO[chainId])
  const toggleWalletModal = useWalletModalToggle()
  const showConnectAWallet = Boolean(!account)
  const [showAddReferModal, setAddReferModal] = useState(false)
  const refer = useReferrer()
  const { loading, stakingInfo: incentives } = useStakingInfo()
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
  function addRefer() {
    setAddReferModal(true)
  }
  return (
    <>
      <PageWrapper gap="lg" justify="center">
        <>
          <AddReferModal isOpen={showAddReferModal} onDismiss={() => setAddReferModal(false)} />
        </>
        {false && (
          <TopSection gap="md">
            <DataCard>
              <CardBGImage />
              <CardNoise />
              <CardSection>
                <AutoColumn gap="md">
                  <RowBetween>
                    <ThemedText.White fontWeight={600}>
                      <Trans>Upswap liquidity mining</Trans>
                    </ThemedText.White>
                  </RowBetween>
                  <RowBetween>
                    <ThemedText.White fontSize={14}>
                      <Trans>Deposit your Liquidity Provider tokens to receive OPK.</Trans>
                    </ThemedText.White>
                  </RowBetween>{' '}
                  <ExternalLink style={{ color: 'white', textDecoration: 'underline' }} href="" target="_blank">
                    <ThemedText.White fontSize={14}>
                      <Trans>Read more about OPK</Trans>
                    </ThemedText.White>
                  </ExternalLink>
                </AutoColumn>
              </CardSection>
              <CardBGImage />
              <CardNoise />
            </DataCard>
          </TopSection>
        )}

        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <DataRow style={{ alignItems: 'baseline' }}>
            <ThemedText.MediumHeader style={{ marginTop: '0.5rem' }}>
              <Trans>Participating pools</Trans>
            </ThemedText.MediumHeader>
          </DataRow>

          <PoolSection>
            {!showConnectAWallet &&
            stakingRewardsExist &&
            refer &&
            refer === '0x0000000000000000000000000000000000000000' ? (
              <OutlineCard>
                <Trans>Add referrer first.</Trans>
                <ButtonEmpty
                  padding="8px"
                  $borderRadius="8px"
                  width={'fit-content'}
                  style={{ float: 'right', fontSize: '14px', height: '3rem' }}
                  onClick={addRefer}
                >
                  {'→'}
                </ButtonEmpty>
              </OutlineCard>
            ) : stakingRewardsExist && !showConnectAWallet ? (
              loading ? (
                <PositionsLoadingPlaceholder />
              ) : incentives?.length === 0 ? (
                <OutlineCard>
                  <Trans>No active pools</Trans>
                </OutlineCard>
              ) : (
                incentives?.map((stakingInfo, index) => {
                  return <PoolCard key={index} stakingInfo={stakingInfo} />
                })
              )
            ) : (
              <OutlineCard>
                {showConnectAWallet ? (
                  <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                    <Trans>Connect a wallet</Trans>
                  </ButtonPrimary>
                ) : (
                  <Trans>No active pools</Trans>
                )}
              </OutlineCard>
            )}
          </PoolSection>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
