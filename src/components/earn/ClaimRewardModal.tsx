import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ReactNode, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { numFixed } from 'utils/numberHelper'

import { useStakingContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks copy'
import { TransactionType } from '../../state/transactions/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
  claimRewards: BigNumber
}

export default function ClaimRewardModal({ isOpen, onDismiss, stakingInfo, claimRewards }: StakingModalProps) {
  const { account } = useActiveWeb3React()
  const rewards = useMemo(() => {
    if (stakingInfo.rewardToken) numFixed(claimRewards, 18)
    return 0
  }, [claimRewards, stakingInfo.rewardToken])

  // monitor call to help UI loading state
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
    if (stakingContract && claimRewards && account) {
      setAttempting(true)
      await stakingContract
        .claimReward(stakingInfo.rewardToken.address, account, claimRewards)
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
  if (!claimRewards) {
    error = error ?? <Trans>No available Rewards </Trans>
  }
  if (attempting) {
    error = error ?? <Trans>Claming... </Trans>
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
          {rewards ? (
            <AutoColumn justify="center" gap="md">
              <ThemedText.Body>
                <Trans>Unclaimed OPC</Trans>
              </ThemedText.Body>
              <ThemedText.Body fontWeight={600} fontSize={36}>
                {rewards}
              </ThemedText.Body>
            </AutoColumn>
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
            <ThemedText.Body fontSize={20}>
              <Trans>Claiming {rewards} OPC</Trans>
            </ThemedText.Body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.LargeHeader>
            <ThemedText.Body fontSize={20}>
              <Trans>Claimed OPC!</Trans>
            </ThemedText.Body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
