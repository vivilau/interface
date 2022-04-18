import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { RowBetween } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { ReactNode, useCallback, useState } from 'react'
import ReactGA from 'react-ga4'
import { TransactionType } from 'state/transactions/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { AutoColumn } from '../../components/Column'
import { StakingInfo } from '../../state/stake/hooks copy'
import { CloseIcon } from '../../theme'
import { ButtonError } from '../Button'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
const HypotheticalRewardRate = styled.div<{ dim: boolean }>`
  display: flex;
  justify-content: space-between;
  padding-right: 20px;
  padding-left: 20px;

  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
  tokenId: number | undefined
  tokenRate: string | number | undefined
}

export default function StakingModal({ isOpen, onDismiss, stakingInfo, tokenId, tokenRate }: StakingModalProps) {
  const { chainId, account, library } = useActiveWeb3React()
  //get
  const stakeAddress = stakingInfo.stakeAddress
  const tokenA = stakingInfo.token0
  const tokenB = stakingInfo.token1

  // state for pending and submitted txn views
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])
  const positionManager = useV3NFTPositionManagerContract()

  const data1 = '0x0000000000000000000000000000000000000000000000000000000000000000'
  function deposit() {
    setAttempting(true)
    if (!positionManager || !tokenId || !account || !chainId || !stakeAddress || !library || !tokenA || !tokenB) {
      return
    }
    const { calldata, value } = NonfungiblePositionManager.safeTransferFromParameters({
      sender: account,
      recipient: stakeAddress,
      tokenId,
      data: data1,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            ReactGA.event({
              category: 'Stake',
              action: 'Deposit',
              label: tokenId.toString(),
            })
            setAttempting(false)
            setHash(response.hash)
            addTransaction(response, {
              type: TransactionType.DEPOSIT_LIQUIDITY_STAKING,
              token0Address: tokenA.address,
              token1Address: tokenB.address,
            })
          })
      })
      .catch((error) => {
        setAttempting(false)
        console.error(error)
      })
  }
  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (attempting) {
    error = error ?? <Trans>Staking... </Trans>
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.MediumHeader>
              <Trans>Stake</Trans>
            </ThemedText.MediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <HypotheticalRewardRate dim={false}>
            <div>
              <ThemedText.Black fontWeight={600}>
                <Trans>Token Rate</Trans>
              </ThemedText.Black>
            </div>

            <ThemedText.Black>
              {tokenRate}
              <Trans> OPC / day</Trans>
            </ThemedText.Black>
          </HypotheticalRewardRate>
          <RowBetween>
            <ButtonError disabled={!!error} error={!!error} onClick={deposit}>
              {error ?? <Trans>Stake</Trans>}
            </ButtonError>
          </RowBetween>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              <Trans>Stake Token</Trans>
            </ThemedText.LargeHeader>
            <ThemedText.Body fontSize={20}>
              <Trans>#{tokenId}</Trans>
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
              <Trans>Staked {tokenId} </Trans>
            </ThemedText.Body>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
