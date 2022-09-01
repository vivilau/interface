import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import AddressInputPanel from 'components/AddressInputPanel'
import useENS from 'hooks/useENS'
import { ReactNode, useState } from 'react'
import { STAKING_REWARDS_INFO } from 'state/stake/hooks'
import styled from 'styled-components/macro'

import { useStakingContract } from '../../hooks/useContract'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
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

interface AddReferModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function AddReferModal({ isOpen, onDismiss }: AddReferModalProps) {
  const { account, chainId } = useWeb3React()
  // console.error('rewards', rewards)
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [referAddress, setReferAddress] = useState<string>('')

  function wrappedOnDismiss() {
    onDismiss()
    setHash(undefined)
    setAttempting(false)
    setReferAddress('')
  }
  const stakingContract = useStakingContract(chainId ? STAKING_REWARDS_INFO[chainId]?.stakingAddress : undefined)

  async function onAddRefer() {
    if (stakingContract && referAddress && account) {
      setAttempting(true)
      await stakingContract
        .initUser(referAddress)
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.ADD_REFERRER,
            referAdress: referAddress,
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
  const { address, loading } = useENS(referAddress)
  const inputError = Boolean(referAddress.length > 0 && !loading && !address)

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (attempting) {
    error = error ?? <Trans>Add... </Trans>
  }
  if (inputError) {
    error = error ?? <Trans>Invalid Address</Trans>
  }
  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={60}>
      {/* 弹窗 */}
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.MediumHeader>
              <Trans>Add Referrer</Trans>
            </ThemedText.MediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <RowBetween>
            <AddressInputPanel
              value={referAddress}
              label="Referrer Address"
              placeholder="Wallet Address"
              onChange={(value: string) => {
                setReferAddress(value)
              }}
            />
          </RowBetween>
          <ButtonError disabled={!!error} error={!!error} onClick={onAddRefer}>
            {error ?? <Trans>Add</Trans>}
          </ButtonError>
        </ContentWrapper>
      )}
      {/* 确认中 */}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="6px" justify={'center'}>
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>Adding... </Trans>
            </ThemedText.BodyPrimary>
          </AutoColumn>
        </LoadingView>
      )}
      {/* 确认完毕 */}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="6px" justify={'center'}>
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>Added!</Trans>
            </ThemedText.BodyPrimary>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
