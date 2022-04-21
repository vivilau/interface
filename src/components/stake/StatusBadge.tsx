import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'

const BadgeWrapper = styled.div`
  font-size: 12px;
  display: flex;
  justify-content: flex-end;
  border-radius: 10%;
`

const BadgeText = styled.div`
  font-weight: 400;
  font-size: 12px;
`
const BadgeStake = styled.div`
  align-items: center;
  background-color: #dbdbdb;
  border-radius: 0.2rem;
  color: green;
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 500;
`

const BadgeUnStake = styled.div`
  align-items: center;
  background-color: #ebd5e4;
  border-radius: 0.2rem;
  color: ${({ theme }) => theme.primary1};
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 500;
`

const BadgeExpired = styled.div`
  align-items: center;
  background-color: #dbdbdb;
  border-radius: 0.2rem;
  color: gray;
  display: inline-flex;
  padding: 4px 6px;
  justify-content: center;
  font-weight: 500;
`

export default function StatusBadge({
  staked,
  inRange,
}: {
  staked: boolean | undefined
  inRange: boolean | undefined
}) {
  return (
    <BadgeWrapper>
      {staked ? (
        <div style={{ alignItems: 'center' }}>
          <BadgeStake>
            <BadgeText>
              <Trans>Staked</Trans>
            </BadgeText>
          </BadgeStake>
          <BadgeText style={{ float: 'right', paddingTop: '4px' }}>
            &nbsp;&nbsp;&nbsp;
            {'>'}
          </BadgeText>
        </div>
      ) : inRange ? (
        <>
          <BadgeUnStake>
            <BadgeText>
              <Trans>UnStaked</Trans>
            </BadgeText>
          </BadgeUnStake>
          <BadgeText style={{ float: 'right', paddingTop: '4px' }}>
            &nbsp;&nbsp;&nbsp;
            {'>'}
          </BadgeText>
        </>
      ) : (
        <>
          <BadgeExpired>
            <BadgeText>
              <Trans>Not expired</Trans>
            </BadgeText>
          </BadgeExpired>
          <BadgeText style={{ float: 'right', paddingTop: '4px' }}>
            &nbsp;&nbsp;&nbsp;
            {'>'}
          </BadgeText>
        </>
      )}
    </BadgeWrapper>
  )
}
