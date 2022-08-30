import { BigNumber } from '@ethersproject/bignumber'
import { hexZeroPad } from '@ethersproject/bytes'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { RowBetween, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useStakingContract } from 'hooks/useContract'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'
import { dateFormat, numFixed } from 'utils/numberHelper'

import { DepositInfo, StakingInfo } from '../../state/stake/hooks'
import { TransactionType } from '../../state/transactions/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
  depositInfo: DepositInfo | undefined
}

export default function UnstakingModal({ isOpen, onDismiss, stakingInfo, depositInfo }: StakingModalProps) {
  const { account } = useActiveWeb3React()
  const tokenId = depositInfo?.tokenid
  const poolId = depositInfo?.incentiveId
  const liquidity = numFixed(depositInfo?.liquidity, 18)
  const rewards = numFixed(depositInfo?.reward, 18)
  // const blockTime = useCurrentBlockTimestamp()
  // console.error('time', blockTime)
  // const expired =
  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const rewardToken = stakingInfo.rewardToken
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakeAddress)
  async function Unstake() {
    if (stakingContract && account && tokenId) {
      setAttempting(true)
      await stakingContract
        .unstakeToken(tokenId, hexZeroPad(BigNumber.from(poolId).toHexString(), 32))
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            type: TransactionType.UNSTAKE_TOKEN,
            tokenId: tokenId.toString(),
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
  const blockTime = useCurrentBlockTimestamp()
  const date = stakingInfo && depositInfo && depositInfo?.startTime.add(stakingInfo?.minDuration)
  const expire = date && blockTime && blockTime.gt(date)
  const expireDate = !expire && date && dateFormat(date)
  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect a wallet</Trans>
  }
  if (attempting) {
    error = error ?? <Trans>Unstaking... </Trans>
  }
  if (!expire) error = error ?? <Trans>not expired </Trans>

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
          {liquidity && expire ? (
            <RowBetween>
              <ThemedText.Body>
                <Trans>Deposited liquidity:</Trans>
              </ThemedText.Body>
              <RowFixed>
                <ThemedText.Body>{liquidity}</ThemedText.Body>
              </RowFixed>
            </RowBetween>
          ) : undefined}
          {rewards && expire ? (
            <RowBetween>
              <ThemedText.Body>
                <Trans>Generated {{ rewardToken }}</Trans>
                {':'}
              </ThemedText.Body>
              <RowFixed>
                <ThemedText.Body>{rewards}</ThemedText.Body>
              </RowFixed>
            </RowBetween>
          ) : undefined}
          {!expire ? (
            <>
              <RowBetween>
                <ThemedText.Body>
                  <Trans>Status:</Trans>
                </ThemedText.Body>
                <RowFixed>
                  <ThemedText.Body>
                    <Trans>not expired</Trans>
                  </ThemedText.Body>
                </RowFixed>
              </RowBetween>
              <RowBetween>
                <ThemedText.Body>
                  <Trans>Expire date:</Trans>
                </ThemedText.Body>
                <RowFixed>
                  <ThemedText.Body>{expireDate}</ThemedText.Body>
                </RowFixed>
              </RowBetween>
            </>
          ) : undefined}
          <ThemedText.SubHeader style={{ textAlign: 'center' }}>
            {/* <Trans>When you unstake, your liquidity is removed from the mining pool.</Trans> */}
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
              <Trans>unstake #{tokenId} </Trans>
            </ThemedText.Body>
            <ThemedText.Body fontSize={20}>
              <Trans>
                Claiming {rewards} {{ rewardToken }}
              </Trans>
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
              <Trans>Claimed {{ rewardToken }}!</Trans>
            </ThemedText.Body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
