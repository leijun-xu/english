import { RequireAuth } from '../../components/RequireAuth'
import { AnalyticsScreen } from '../../screens/AnalyticsScreen'

export default function AnalyticsRoute() {
  return <RequireAuth><AnalyticsScreen /></RequireAuth>
}
