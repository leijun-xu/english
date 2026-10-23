import { RequireAuth } from '../../components/RequireAuth'
import { SettingsScreen } from '../../screens/SettingsScreen'

export default function SettingsRoute() {
  return <RequireAuth><SettingsScreen /></RequireAuth>
}
