import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useCurrency } from 'hooks/Tokens'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'
import { numFixed } from 'utils/numberHelper'

import { useStakingContract } from '../../hooks/useContract'
import { StakingInfo, useClaimNum } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { CloseIcon, ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween, RowFixed } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
}

export default function ClaimRewardModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useWeb3React()
  const claimRewards = useClaimNum()
  const rewards = numFixed(claimRewards, 18)
  // console.error('rewards', rewards)
  // monitor call to help UI loading state
  const rewardToken = stakingInfo.rewardToken
  const rewardTokenName = useCurrency(rewardToken)?.symbol
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    onDismiss()
    setHash(undefined)
    setAttempting(false)
  }

  const stakingContract = useStakingContract(stakingInfo.stakeAddress)

  async function onClaimReward() {
    if (stakingContract && claimRewards && account && stakingInfo.rewardToken) {
      setAttempting(true)
      await stakingContract
        .claimReward(stakingInfo.rewardToken, account, claimRewards)
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.CLAIM,
            recipient: account,
          })
          setAttempting(false)
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (!claimRewards || claimRewards.eq('0')) {
    error = error ?? <Trans>No unclaimed {rewardTokenName} </Trans>
  }
  if (attempting) {
    error = error ?? <Trans>Claming...</Trans>
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.MediumHeader>
              <Trans>Claim</Trans>
            </ThemedText.MediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          {claimRewards ? (
            <RowBetween>
              <ThemedText.BodyPrimary>
                <Trans>Unclaimed {rewardTokenName}</Trans>
                {':'}
              </ThemedText.BodyPrimary>
              <RowFixed>
                <ThemedText.BodyPrimary>{rewards}</ThemedText.BodyPrimary>
              </RowFixed>
            </RowBetween>
          ) : undefined}
          <ThemedText.SubHeader style={{ textAlign: 'center' }}>
            {/* <Trans>When you claim your wallet will receive the claimRewards.</Trans> */}
          </ThemedText.SubHeader>
          <ButtonError disabled={!!error} error={!!error && !!claimRewards} onClick={onClaimReward}>
            {error ?? <Trans>Claim</Trans>}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>
                Claiming {rewards} {rewardTokenName}
              </Trans>
            </ThemedText.BodyPrimary>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.LargeHeader>
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>Claimed {rewardTokenName}!</Trans>
            </ThemedText.BodyPrimary>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
