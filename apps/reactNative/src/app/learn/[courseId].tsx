import { RequireAuth } from '../../components/RequireAuth'
import { LearnScreen } from '../../screens/LearnScreen'

export default function LearnRoute() {
  return <RequireAuth><LearnScreen /></RequireAuth>
}
