import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useStakingContract } from 'hooks/useContract'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'

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
  tokenId: number | undefined
  liquidity: number | undefined
  rewards: number | undefined
}

export default function UnstakingModal({
  isOpen,
  onDismiss,
  stakingInfo,
  tokenId,
  liquidity,
  rewards,
}: StakingModalProps) {
  const { account } = useActiveWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakeAddress)
  async function Unstake() {
    if (stakingContract && account && tokenId) {
      // setAttempting(true)
      await stakingContract
        .unstakeToken(tokenId, '0x0000000000000000000000000000000000000000000000000000000000000000')
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.UNSTAKE_TOKEN,
            tokenId: tokenId.toString(),
          })
        })
        .catch((error: any) => {
          console.log(error)
        })
    }
  }
  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect a wallet</Trans>
  }
  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.MediumHeader>
              <Trans>Unstake</Trans>
            </ThemedText.MediumHeader>
            <CloseIcon onClick={wrappedOndismiss} />
          </RowBetween>
          {liquidity && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.Body fontWeight={600} fontSize={36}>
                {liquidity}
              </ThemedText.Body>
              <ThemedText.Body>
                <Trans>Deposited liquidity:</Trans>
              </ThemedText.Body>
            </AutoColumn>
          )}
          {rewards && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.Body fontWeight={600} fontSize={36}>
                {rewards}
              </ThemedText.Body>
              <ThemedText.Body>
                <Trans>Unclaimed OPC</Trans>
              </ThemedText.Body>
            </AutoColumn>
          )}
          <ThemedText.SubHeader style={{ textAlign: 'center' }}>
            <Trans>When you unstake, your liquidity is removed from the mining pool.</Trans>
          </ThemedText.SubHeader>
          <ButtonError disabled={!!error} error={!!error && !!liquidity} onClick={Unstake}>
            {error ?? <Trans>UNSTAKE</Trans>}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.Body fontSize={20}>
              <Trans>Withdrawing {liquidity} </Trans>
            </ThemedText.Body>
            <ThemedText.Body fontSize={20}>
              <Trans>Claiming {rewards} OPC</Trans>
            </ThemedText.Body>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.LargeHeader>
            <ThemedText.Body fontSize={20}>
              <Trans>Withdrew !</Trans>
            </ThemedText.Body>
            <ThemedText.Body fontSize={20}>
              <Trans>Claimed OPC!</Trans>
            </ThemedText.Body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
