import { BigNumber } from '@ethersproject/bignumber'
import { hexZeroPad } from '@ethersproject/bytes'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { RowBetween, RowFixed } from 'components/Row'
import { useCurrency } from 'hooks/Tokens'
import { useStakingContract } from 'hooks/useContract'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'
import { dateFormat, numFixed } from 'utils/numberHelper'

import { DepositInfo, StakingInfo } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
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
  const { account } = useWeb3React()
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
  const rewardTokenName = useCurrency(rewardToken)?.symbol
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
              <ThemedText.BodyPrimary>
                <Trans>Deposited liquidity:</Trans>
              </ThemedText.BodyPrimary>
              <RowFixed>
                <ThemedText.BodyPrimary>{liquidity}</ThemedText.BodyPrimary>
              </RowFixed>
            </RowBetween>
          ) : undefined}
          {rewards && expire ? (
            <RowBetween>
              <ThemedText.BodyPrimary>
                <Trans>Generated {rewardTokenName}</Trans>
                {':'}
              </ThemedText.BodyPrimary>
              <RowFixed>
                <ThemedText.BodyPrimary>{rewards}</ThemedText.BodyPrimary>
              </RowFixed>
            </RowBetween>
          ) : undefined}
          {!expire ? (
            <>
              <RowBetween>
                <ThemedText.BodyPrimary>
                  <Trans>Status:</Trans>
                </ThemedText.BodyPrimary>
                <RowFixed>
                  <ThemedText.BodyPrimary>
                    <Trans>not expired</Trans>
                  </ThemedText.BodyPrimary>
                </RowFixed>
              </RowBetween>
              <RowBetween>
                <ThemedText.BodyPrimary>
                  <Trans>Expire date:</Trans>
                </ThemedText.BodyPrimary>
                <RowFixed>
                  <ThemedText.BodyPrimary>{expireDate}</ThemedText.BodyPrimary>
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
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>unstake #{tokenId?.toString()} </Trans>
            </ThemedText.BodyPrimary>
            <ThemedText.BodyPrimary fontSize={20}>
              <Trans>
                Claiming {rewards} {rewardTokenName}
              </Trans>
            </ThemedText.BodyPrimary>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
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
