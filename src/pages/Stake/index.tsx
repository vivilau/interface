import { Trans } from '@lingui/macro'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { LoadingRows } from 'pages/Pool/styleds'
import { STAKING_REWARDS_INFO } from 'state/stake/hooks'
import { useStakingInfo } from 'state/stake/hooks copy'
import styled from 'styled-components/macro'

import { OutlineCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import PoolCard from '../../components/stake/PoolCard'
import { ExternalLink, ThemedText } from '../../theme'
const PageWrapper = styled(AutoColumn)`
  max-width: 870px;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  max-width: 800px;
`};
  ${({ theme }) => theme.mediaWidth.upToSmall`
max-width: 500px;
`};
`

const TopSection = styled(AutoColumn)`
  max-width: 870px;
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
  const { chainId } = useActiveWeb3React()
  const stakingRewardsExist = Boolean(
    typeof chainId === 'number' && chainId === 80001 && (STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0
  )

  // const [num, setNum] = useState<number | undefined>(0)
  // const [incentive, setIncentive] = useState<StakingInfo | undefined>()
  // const incentives: StakingInfo[] = useMemo(() => [], [])
  // const tokenContract = useStakingContract('0x72055D6677c98d1B67F65aF21074a737a3C64b52')
  // useEffect(() => {
  //   if (stakingRewardsExist && tokenContract) {
  //     tokenContract.numberOfIncentives().then((rs) => {
  //       setNum(rs.toNumber())
  //     })
  //   }
  // }, [stakingRewardsExist, tokenContract])
  // useEffect(() => {
  //   for (let index = 0; index < (num ? num : 0); index++) {
  //     tokenContract?.incentiveInfo(index).then((rs) => {
  //       incentives[index] = rs
  //       setIncentive(rs)
  //     })
  //   }
  // }, [incentives, num, tokenContract])
  const incentives = useStakingInfo()
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
  return (
    <>
      <PageWrapper gap="lg" justify="center">
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
                      <Trans>Deposit your Liquidity Provider tokens to receive OPC.</Trans>
                    </ThemedText.White>
                  </RowBetween>{' '}
                  <ExternalLink style={{ color: 'white', textDecoration: 'underline' }} href="" target="_blank">
                    <ThemedText.White fontSize={14}>
                      <Trans>Read more about OPC</Trans>
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
            {stakingRewardsExist && incentives?.length === 0 ? (
              <PositionsLoadingPlaceholder />
            ) : !incentives ? (
              <OutlineCard>
                <Trans>No active pools</Trans>
              </OutlineCard>
            ) : incentives.length === 0 ? (
              <OutlineCard>
                <Trans>No active pools</Trans>
              </OutlineCard>
            ) : (
              incentives?.map((stakingInfo, index) => {
                // need to sort by added liquidity here
                return <PoolCard key={index} stakingInfo={stakingInfo} />
              })
            )}
          </PoolSection>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
